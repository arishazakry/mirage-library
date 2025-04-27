import { NextResponse } from "next/server";
import { metricList } from "@/lib/utils.js";
import { v4 as uuidv4 } from "uuid";
import pgPool from "@/app/api/config/postgresql";
import { getQuery } from "@/app/api/search/route";
import { rangeFilterMap } from "@/app/api/filters/available/route";

export async function GET(req) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();
      let client;

      try {
        let ids,
          query,
          filters,
          sortBy,
          sortOrder = "ASC",
          metrics;
        filters = filters ?? {};
        query = query ?? { key: "*", value: "" };
        metrics = metrics ?? ["track_sp_energy", "track_sp_liveness"];
        if (metrics.length !== 2) {
          throw new Error(
            "Exactly two metrics must be provided for scatter plot."
          );
        }
        const hisNum = 20;
        const values = [];
        const [xMetric, yMetric] = metrics;
        const [xMin, xMax] = rangeFilterMap[xMetric]?.range ?? [0, 1];
        const [yMin, yMax] = rangeFilterMap[yMetric]?.range ?? [0, 1];
        const stepX = (xMax - xMin) / hisNum;
        const stepY = (yMax - yMin) / hisNum;

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

        const tempTableName = `temp_filtered_data_${uuidv4().replace(
          /-/g,
          "_"
        )}`;
        await client.query(
          `CREATE TEMP TABLE ${tempTableName} AS
           SELECT ${["event_ma_id", ...metrics].join(", ")}
           FROM event_flat ${whereClause};`,
          values
        );

        await client.query(`ANALYZE ${tempTableName}`);

        const scatterRes = await client.query(
          `
            SELECT
              width_bucket(${xMetric}, $1, $2, $3) AS x_bucket,
              width_bucket(${yMetric}, $4, $5, $6) AS y_bucket,
              COUNT(*) AS count
            FROM ${tempTableName}
            GROUP BY x_bucket, y_bucket
            ORDER BY x_bucket, y_bucket;
          `,
          [xMin, xMax, hisNum, yMin, yMax, hisNum]
        );

        const binMap = new Map();
        for (const row of scatterRes.rows) {
          const key = `${row.x_bucket},${row.y_bucket}`;
          binMap.set(key, parseInt(row.count));
        }

        const matrix = [];
        for (let i = 1; i <= hisNum; i++) {
          for (let j = 1; j <= hisNum; j++) {
            const xRange = [xMin + (i - 1) * stepX, xMin + i * stepX];
            const yRange = [yMin + (j - 1) * stepY, yMin + j * stepY];
            const count = binMap.get(`${i},${j}`) || 0;
            matrix.push({ xRange, yRange, count });
          }
        }

        controller.enqueue(
          encoder.encode(
            `event: scatter\ndata: ${JSON.stringify({
              metrics,
              data: matrix,
              xrange: [xMin, xMax],
              yrange: [yMin, yMax],
            })}\n\n`
          )
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
