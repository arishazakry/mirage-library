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
        let { ids, query, filters, sortBy, sortOrder = "ASC", metrics } = body;
        filters = filters ?? {};
        query = query ?? { key: "*", value: "" };
        metrics = metrics ?? metricRadarList.map((d) => d.key);
        if (metrics.length !== 2) {
          throw new Error(
            "Exactly two metrics must be provided for scatter plot."
          );
        }
        const hisNum = 50;
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

        // get the min max median of the metrics here
        // await client.query(
        //   `SELECT ${metrics
        //     .map(
        //       (metric) =>
        //         `MIN(${metric}) AS ${metric}_min, MAX(${metric}) AS ${metric}_max, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${metric}) AS ${metric}_median`
        //     )
        //     .join(", ")}
        //    FROM ${tempTableName};`
        // );
        await getRadarData(client, tempTableName, metrics, controller, encoder);

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
export async function getRadarData(
  client,
  tempTableName,
  metrics,
  controller,
  encoder
) {
  const countRes = await client.query(`SELECT COUNT(*) FROM ${tempTableName}`);
  const rowCount = parseInt(countRes.rows[0].count);

  if (rowCount > 100) {
    const minMaxMedianRes = await client.query(
      `SELECT ${metrics
        .map(
          (metric) =>
            // `MIN(${metric}) AS ${metric}_min, MAX(${metric}) AS ${metric}_max, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${metric}) AS ${metric}_median`
            `PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY ${metric}) AS ${metric}_min, PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY ${metric}) AS ${metric}_max, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${metric}) AS ${metric}_median`
          //     `AVG(${metric}) AS ${metric}_median,
          // STDDEV_SAMP(${metric}) AS ${metric}_stddev,
          // COUNT(${metric}) AS ${metric}_n,
          // AVG(${metric}) - 1.645 * (STDDEV_SAMP(${metric}) / SQRT(COUNT(${metric}))) AS ${metric}_min,
          // AVG(${metric}) + 1.645 * (STDDEV_SAMP(${metric}) / SQRT(COUNT(${metric}))) AS ${metric}_max`
        )
        .join(", ")}
       FROM ${tempTableName};`
    );

    controller.enqueue(
      encoder.encode(
        `event: radar\ndata: ${JSON.stringify({
          mode: "binned",
          metric: metrics,
          data: minMaxMedianRes?.rows ?? [],
        })}\n\n`
      )
    );

    return 1;
  } else {
    // --- RAW POINTS SCATTER ---
    const rawPoints = await client.query(
      `
            SELECT ${["event_ma_id", ...metrics].join(", ")}
            FROM ${tempTableName};
          `
    );

    controller.enqueue(
      encoder.encode(
        `event: radar\ndata: ${JSON.stringify({
          mode: "raw",
          metric: metrics,
          data: rawPoints.rows,
        })}\n\n`
      )
    );
    return 2;
  }
}
