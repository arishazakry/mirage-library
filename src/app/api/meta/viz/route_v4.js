import { NextResponse } from "next/server";
import { getQuery } from "../../search/route.js";
import pgPool from "../../config/postgresql.js";
import { metricList } from "@/lib/utils.js";
import { rangeFilterMap } from "../../filters/available/route.js";

export const revalidate = 60;

export async function POST(req) {
  const startTime = Date.now();
  let client;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await req.json();
        let { ids, query, filters, sortBy, sortOrder = "ASC", metrics } = body;

        const validMetrics = new Set(metricList.map((d) => d.key));
        metrics =
          metrics?.filter((m) => validMetrics.has(m)) ||
          metricList.map((d) => d.key);

        const hisNum = 10;
        const values = [];
        let whereCondition = "";

        if (ids) {
          values.push(ids);
          whereCondition = "WHERE event_ma_id = ANY($1)";
        } else {
          const {
            whereClause,
            searchClause,
            values: qv,
          } = getQuery(sortBy, sortOrder, filters, query);
          values.push(...qv);
          whereCondition = `${whereClause || ""} ${searchClause || ""}`.trim();
        }

        client = await pgPool.connect();

        await client.query(`DROP TABLE IF EXISTS temp_filtered_data`);
        await client.query(
          `CREATE TEMP TABLE temp_filtered_data AS
          SELECT event_ma_id, artist_sp_genre, artist_wd_country, track_sp_key, ${metrics.join(
            ", "
          )}
          FROM event_flat
          ${whereCondition};`,
          values
        );

        // Total Count
        const countResult = await client.query(
          `SELECT COUNT(*) AS total FROM temp_filtered_data`
        );
        const totalCount = parseInt(countResult.rows[0].total);

        // Begin streaming
        controller.enqueue(encoder.encode('{"data":{'));

        // Stream histograms
        controller.enqueue(encoder.encode('"his":{'));
        for (let i = 0; i < metrics.length; i++) {
          const metric = metrics[i];
          const [min, max] = rangeFilterMap[metric]?.range ?? [0, 1];
          const step = (max - min) / hisNum;

          const res = await client.query(
            `
            SELECT width_bucket(${metric}, $1, $2, $3) AS bucket, COUNT(*) AS count
            FROM temp_filtered_data
            WHERE ${metric} IS NOT NULL AND ${metric} BETWEEN $1 AND $2
            GROUP BY bucket ORDER BY bucket
            `,
            [min, max, hisNum]
          );

          const bucketMap = new Map(
            res.rows.map((r) => [parseInt(r.bucket), parseInt(r.count)])
          );
          const x = Array.from({ length: hisNum }, (_, i) => [
            min + i * step,
            min + (i + 1) * step,
          ]);
          const y = x.map((_, i) => bucketMap.get(i + 1) || 0);

          const comma = i > 0 ? "," : "";
          controller.enqueue(
            encoder.encode(
              `${comma}"${metric}":${JSON.stringify({
                x,
                y,
                xrange: [min, max],
              })}`
            )
          );
        }
        controller.enqueue(encoder.encode("},"));

        // Rankings
        const rankQuery = `
          SELECT * FROM (
            SELECT 'genre' AS type, genre AS title, COUNT(*) AS count
            FROM temp_filtered_data, unnest(artist_sp_genre) AS genre
            WHERE artist_sp_genre IS NOT NULL
            GROUP BY genre
            ORDER BY count DESC
            LIMIT 10
          ) AS genre_data

          UNION ALL

          SELECT * FROM (
            SELECT 'country' AS type, artist_wd_country AS title, COUNT(*) AS count
            FROM temp_filtered_data
            WHERE artist_wd_country IS NOT NULL
            GROUP BY artist_wd_country
            ORDER BY count DESC
            LIMIT 10
          ) AS country_data

          UNION ALL

          SELECT * FROM (
            SELECT 'key' AS type, key AS title, COUNT(*) AS count
            FROM temp_filtered_data, unnest(track_sp_key) AS key
            WHERE track_sp_key IS NOT NULL
            GROUP BY key
            ORDER BY count DESC
            LIMIT 10
          ) AS key_data
        `;
        const rankRes = await client.query(rankQuery);
        const rank = {
          artist_sp_genre: [],
          artist_wd_country: [],
          track_sp_key: [],
        };

        rankRes.rows.forEach((row) => {
          const item = { title: row.title, count: parseInt(row.count) };
          if (row.type === "genre") rank.artist_sp_genre.push(item);
          else if (row.type === "country") rank.artist_wd_country.push(item);
          else if (row.type === "key") rank.track_sp_key.push(item);
        });

        controller.enqueue(encoder.encode(`"rank":${JSON.stringify(rank)},`));

        const executionTime = Date.now() - startTime;
        controller.enqueue(
          encoder.encode(
            `"totalCount":${totalCount},"executionTime":"${executionTime}ms"`
          )
        );
        controller.enqueue(encoder.encode("}}"));
        controller.close();
      } catch (error) {
        console.error("API Stream Error:", error);
        controller.enqueue(encoder.encode(`"error":"${error.message}"}}`));
        controller.close();
      } finally {
        if (client) {
          try {
            await client.query("DROP TABLE IF EXISTS temp_filtered_data");
          } catch (e) {}
          client.release();
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
