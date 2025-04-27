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
        const body = await req.json();
        let { ids, query, filters, sortBy, sortOrder = "ASC", metrics } = body;

        metrics = metrics ?? ["track_sp_energy", "track_sp_liveness"];
        if (!metrics || metrics.length === 0)
          throw new Error("No valid metrics provided.");

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

        for (const metric of metrics) {
          const [min, max] = rangeFilterMap[metric]?.range ?? [0, 1];
          const step = (max - min) / hisNum;

          const res = await client.query(
            `
              SELECT width_bucket(${metric}, $1, $2, $3) AS bucket, COUNT(*) AS count
              FROM ${tempTableName}
              WHERE ${metric} IS NOT NULL AND ${metric} BETWEEN $1 AND $2
              GROUP BY bucket ORDER BY bucket;
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

          controller.enqueue(
            encoder.encode(
              `event: histogram\ndata: ${JSON.stringify({
                metric,
                data: { x, y, xrange: [min, max] },
              })}\n\n`
            )
          );
        }

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
