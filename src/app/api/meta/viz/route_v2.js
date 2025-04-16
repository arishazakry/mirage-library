import { NextResponse } from "next/server";
import pgPool from "../../config/postgresql";
import { rangeFilterMap } from "../../filters/available/route";
import { getQuery } from "../../search/route";
import { metricList } from "@/lib/utils";
import esClient from "../../config/elasticsearch";

const activeControllers = new Map();

export async function POST(req) {
  const body = await req.json();
  const {
    filters,
    query,
    sortBy,
    sortOrder,
    clientId,
    metrics = metricList.map((d) => d.key),
  } = body;

  if (activeControllers.has(clientId)) {
    activeControllers.get(clientId).abort();
  }
  const controller = new AbortController();
  activeControllers.set(clientId, controller);
  const signal = controller.signal;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controllerStream) {
      let client;
      try {
        client = await pgPool.connect();
        const { whereClause, searchClause, values } = getQuery(
          sortBy,
          sortOrder,
          filters,
          query
        );

        const eventSQL = `
          SELECT e.event_ma_id
          FROM event e
            INNER JOIN location l ON e.location_rg_id = l.location_rg_id
            INNER JOIN station s ON e.station_rg_id = s.station_rg_id
            INNER JOIN track t ON e.track_sp_id = t.track_sp_id
            LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
          ${whereClause} ${searchClause}
        `;

        const { rows } = await client.query(eventSQL, values);
        const eventIds = rows.map((r) => r.event_ma_id);
        if (!eventIds.length) {
          controllerStream.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
          controllerStream.close();
          return;
        }

        // Prepare Elasticsearch aggregations
        const histoNum = 20;
        const esAggs = {};
        for (const metric of metrics) {
          const [min, max] = rangeFilterMap[metric]?.range || [0, 1];
          const interval = (max - min) / histoNum;
          esAggs[metric] = {
            histogram: {
              field: metric,
              interval,
              extended_bounds: { min, max },
            },
          };
        }
        esAggs["top_genres"] = {
          terms: { field: "artist_sp_genre.keyword", size: 10 },
        };
        esAggs["top_countries"] = {
          terms: { field: "artist_wd_country.keyword", size: 10 },
        };
        esAggs["top_keys"] = {
          terms: { field: "track_sp_key.keyword", size: 10 },
        };

        // Elasticsearch can only handle 10k terms max in a `terms` query
        const chunkSize = 10000;
        const chunks = [];
        for (let i = 0; i < eventIds.length; i += chunkSize) {
          chunks.push(eventIds.slice(i, i + chunkSize));
        }

        const results = { his: {}, rank: {} };

        for (const chunk of chunks) {
          if (signal.aborted) throw new Error("Aborted");

          const esRes = await esClient.search({
            index: "event_view",
            size: 0,
            query: {
              terms: { event_ma_id: chunk },
            },
            aggs: esAggs,
          });

          // Merge histogram buckets
          for (const metric of metrics) {
            const buckets = esRes.aggregations[metric]?.buckets || [];
            if (!results.his[metric]) {
              const [min, max] = rangeFilterMap[metric]?.range || [0, 1];
              const interval = (max - min) / histoNum;
              const x = Array.from({ length: histoNum + 1 }, (_, i) => [
                min + (i - 1) * interval,
                min + i * interval,
              ]);
              x.push([max, max + interval]);
              results.his[metric] = {
                x,
                y: Array(histoNum + 2).fill(0),
                xrange: [min, max],
              };
            }

            const [min, max] = rangeFilterMap[metric]?.range || [0, 1];
            const interval = (max - min) / histoNum;
            for (const b of buckets) {
              const index = Math.round((b.key - min) / interval) + 1;
              if (index >= 0 && index < results.his[metric].y.length) {
                results.his[metric].y[index] += b.doc_count;
              }
            }
          }

          // Merge top rankings
          for (const field of ["top_genres", "top_countries", "top_keys"]) {
            const list = esRes.aggregations[field]?.buckets || [];
            if (!results.rank[field]) {
              results.rank[field] = new Map();
            }
            for (const item of list) {
              const count = results.rank[field].get(item.key) || 0;
              results.rank[field].set(item.key, count + item.doc_count);
            }
          }
        }

        // Send histogram data
        controllerStream.enqueue(
          encoder.encode(
            `event: histograms\ndata: ${JSON.stringify(results.his)}\n\n`
          )
        );

        // Format and send rankings
        const formatRank = (map) =>
          [...map.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([title, count]) => ({ title, count }));

        controllerStream.enqueue(
          encoder.encode(
            `event: rankings\ndata: ${JSON.stringify({
              artist_sp_genre: formatRank(results.rank.top_genres),
              artist_wd_country: formatRank(results.rank.top_countries),
              track_sp_key: formatRank(results.rank.top_keys),
            })}\n\n`
          )
        );

        controllerStream.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
        controllerStream.close();
      } catch (e) {
        const message =
          e.name === "AbortError" ? "Request cancelled" : e.message;
        controllerStream.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`
          )
        );
        controllerStream.close();
      } finally {
        if (client) client.release();
        activeControllers.delete(clientId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
