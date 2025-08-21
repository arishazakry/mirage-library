import { NextResponse } from "next/server";
import { getQuery } from "../../search/route.js";
import pgPool from "../../config/postgresql.js";
import { metricList, metricRadarList } from "@/lib/utils.js";
import { rangeFilterMap } from "../../filters/available/route.js";
import { v4 as uuidv4 } from "uuid"; // Import UUID library
import { getScatterData } from "./scatter/route.js";
import { getRadarData } from "./radar/route.js";
import { getNetwork } from "./network/route.js";

export const revalidate = 60;

export async function POST(req) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();
      let client;

      try {
        const body = await req.json();
        let {
          ids,
          query,
          filters,
          sortBy,
          sortOrder = "ASC",
          metrics,
          scatterMetrics = ["track_sp_valence", "track_sp_acousticness"],
          graph
        } = body;

        const validMetrics = new Set(metricList.map((d) => d.key));
        metrics =
          metrics?.filter((m) => validMetrics.has(m)) ||
          metricList.map((d) => d.key);
        const radarMetric = metricRadarList.map((d) => d.key);
        const hisNum = 10;
        const values = [];
        let whereClause = "";

        if (ids) {
          values.push(ids);
          whereClause = "WHERE event_ma_id = ANY($1)";
        } else {
          const {
            whereClause: w,
            searchClause,
            values: qv,
          } = getQuery(sortBy, sortOrder, filters, query);
          values.push(...qv);
          whereClause = `${w || ""} ${searchClause || ""}`.trim();
        }

        client = await pgPool.connect();

        // Generate unique table name based on UUID
        const tempTableName = `temp_filtered_data_${uuidv4().replace(
          /-/g,
          "_"
        )}`;

        // Create temporary table with unique name per request
        const metricsCombine = {};
        metrics.forEach((metric) => {
          metricsCombine[metric] = 1;
        });
        scatterMetrics.forEach((metric) => {
          metricsCombine[metric] = 1;
        });
        radarMetric.forEach((metric) => {
          metricsCombine[metric] = 1;
        });
        await client.query(
          `CREATE TEMP TABLE ${tempTableName} AS
          SELECT event_ma_id, artist_sp_genre, artist_wd_country, track_sp_key, ${Object.keys(
            metricsCombine
          ).join(", ")},
          artist_sp_id, artist_sp_name
          FROM event_flat ${whereClause};`,
          values
        );

        await client.query(`ANALYZE ${tempTableName}`);

        // Histogram chunk per metric
        for (const metric of metrics) {
          const [min, max] = rangeFilterMap[metric]?.range ?? [0, 1];
          const step = (max - min) / hisNum;

          const query = `
            SELECT width_bucket(${metric}, ${min}, ${max}, ${hisNum}) AS bucket,
                   COUNT(*) AS count
            FROM ${tempTableName}
            WHERE ${metric} IS NOT NULL
              AND ${metric} BETWEEN ${min} AND ${max}
            GROUP BY bucket ORDER BY bucket
          `;

          const res = await client.query(query);
          const bucketMap = new Map(
            res.rows.map((r) => [parseInt(r.bucket), parseInt(r.count)])
          );
          const x = Array.from({ length: hisNum }, (_, i) => [
            min + i * step,
            min + (i + 1) * step,
          ]);
          const y = x.map((_, i) => bucketMap.get(i + 1) || 0);

          controller.enqueue(
            encoder.encode(
              `event: histogram\ndata: ${JSON.stringify({
                metric,
                data: { x, y, xrange: [min, max] },
              })}\n\n`
            )
          );
        }

        // Rankings query
        const rankQuery = `
          (
            SELECT 'genre' AS type, genre AS title, COUNT(*) AS count
            FROM ${tempTableName}, unnest(artist_sp_genre) AS genre
            WHERE artist_sp_genre IS NOT NULL
            GROUP BY genre
            ORDER BY count DESC
            LIMIT 10
          )
          UNION ALL
          (
            SELECT 'country' AS type, artist_wd_country AS title, COUNT(*) AS count
            FROM ${tempTableName}
            WHERE artist_wd_country IS NOT NULL
            GROUP BY artist_wd_country
            ORDER BY count DESC
            LIMIT 10
          )
          UNION ALL
          (
            SELECT 'key' AS type, key AS title, COUNT(*) AS count
            FROM ${tempTableName}, unnest(track_sp_key) AS key
            WHERE track_sp_key IS NOT NULL
            GROUP BY key
            ORDER BY count DESC
            LIMIT 10
          )
        `;

        const rankRes = await client.query(rankQuery);
        const rankData = {
          artist_sp_genre: [],
          artist_wd_country: [],
          track_sp_key: [],
        };
        for (const row of rankRes.rows) {
          const obj = { title: row.title, count: parseInt(row.count) };
          if (row.type === "genre") rankData.artist_sp_genre.push(obj);
          else if (row.type === "country") rankData.artist_wd_country.push(obj);
          else if (row.type === "key") rankData.track_sp_key.push(obj);
        }

        controller.enqueue(
          encoder.encode(
            `event: rankings\ndata: ${JSON.stringify(rankData)}\n\n`
          )
        );

        if (scatterMetrics && scatterMetrics.length > 1) {
          await getScatterData(
            client,
            tempTableName,
            scatterMetrics[0],
            scatterMetrics[1],
            rangeFilterMap,
            50,
            controller,
            encoder
          );
        }
        await getRadarData(
          client,
          tempTableName,
          metricRadarList.map((d) => d.key),
          controller,
          encoder
        );
        const {
            threshold: graphThreshold,
            metadataVariable: graphMetadataVariable = "artists", // artists, genres, timbres
            maxNodes:graphMaxNodes = 100,
            communityDetection
          } = graph??{};
        await getNetwork(
          client,
          tempTableName,
          graphMetadataVariable,
          graphMaxNodes,
          communityDetection,
          controller,
          encoder
        );
        const timeTaken = Date.now() - startTime;
        controller.enqueue(
          encoder.encode(
            `event: done\ndata: {"executionTime": "${timeTaken}ms"}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`
          )
        );
        controller.close();
      } finally {
        try {
          client?.release();
        } catch {}
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
