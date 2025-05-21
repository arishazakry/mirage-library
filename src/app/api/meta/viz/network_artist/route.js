import { NextResponse } from "next/server";
import { metricList, metricRadarList } from "@/lib/utils.js";
import { v4 as uuidv4 } from "uuid";
import pgPool from "@/app/api/config/postgresql";
import { getQuery } from "@/app/api/search/route";
import { rangeFilterMap } from "@/app/api/filters/available/route";
import { range, scaleBand } from "d3";

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
          threshold,
        } = body;
        filters = filters ?? {};
        query = query ?? { key: "*", value: "" };
        threshold = threshold ?? 1;

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

        const tempTableName = `temp_filtered_data_artist_${uuidv4().replace(
          /-/g,
          "_"
        )}`;
        await client.query(
          `CREATE TEMP TABLE ${tempTableName} AS
           SELECT event_ma_id,
           track_sp_id,
          artist_sp_id,
          artist_sp_name,
          artist_sp_genre
           FROM event_flat ${whereClause};`,
          values
        );

        await client.query(`ANALYZE ${tempTableName}`);

        await getArtistNetwork(
          client,
          tempTableName,
          threshold,
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
export async function getArtistNetwork(
  client,
  tempTableName,
  threshold = 1,
  controller,
  encoder
) {
  const res = await client.query(
    `
     WITH top_artists AS (
        SELECT artist_sp_id, artist_sp_name, artist_sp_genre, COUNT(*) AS size
        FROM ${tempTableName}
        WHERE artist_sp_id IS NOT NULL
        GROUP BY artist_sp_id, artist_sp_name, artist_sp_genre
        ORDER BY COUNT(*) DESC
        LIMIT 100
      ),
      artist_genre AS (
        SELECT artist_sp_id, artist_sp_name, UNNEST(artist_sp_genre) AS genre
        FROM top_artists
      ),
      artist_pairs AS (
        SELECT
          a1.artist_sp_id AS source,
          a2.artist_sp_id AS target,
          COUNT(*) AS weight
        FROM artist_genre a1
        JOIN artist_genre a2
          ON a1.genre = a2.genre AND a1.artist_sp_id < a2.artist_sp_id
        GROUP BY source, target
      )
      SELECT
        'nodes' AS type,
        json_agg(
          json_build_object(
            'id', ta.artist_sp_id,
            'label', ta.artist_sp_name,
            'size', ta.size
          )
        ) AS data
      FROM top_artists ta

      UNION ALL

      SELECT
        'edges' AS type,
        json_agg(
          json_build_object(
            'source', source,
            'target', target,
            'weight', weight
          )
        ) AS data
      FROM artist_pairs;
  `,
    []
  );
  const data = {
    nodes: [],
    edges: [],
  };

  for (const row of res.rows) {
    data[row.type] = row.data;
  }
  controller.enqueue(
    encoder.encode(
      `event: network_artist\ndata: ${JSON.stringify({
        mode: "network",
        metric: ["artist", "artist_sp_genre"],
        data,
      })}\n\n`
    )
  );
}
