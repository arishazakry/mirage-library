import { NextResponse } from "next/server";
import { metricList } from "@/lib/utils.js";
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
        metrics = metrics ?? ["track_sp_energy", "track_sp_liveness"];
        if (metrics.length !== 2) {
          throw new Error(
            "Exactly two metrics must be provided for scatter plot."
          );
        }
        const hisNum = 50;
        const values = [];
        const [xMetric, yMetric] = metrics;
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

        // Check number of rows
        await getScatterData(
          client,
          tempTableName,
          xMetric,
          yMetric,
          rangeFilterMap,
          hisNum,
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
export async function getScatterData(
  client,
  tempTableName,
  xMetric,
  yMetric,
  rangeFilterMap,
  hisNum,
  controller,
  encoder
) {
  const [xMin, xMax] = rangeFilterMap[xMetric]?.range ?? [0, 1];
  const [yMin, yMax] = rangeFilterMap[yMetric]?.range ?? [0, 1];
  const stepX = (xMax - xMin) / hisNum;
  const stepY = (yMax - yMin) / hisNum;
  const countRes = await client.query(`SELECT COUNT(*) FROM ${tempTableName}`);
  const rowCount = parseInt(countRes.rows[0].count);

  if (rowCount > 1000) {
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

    const scaleX = scaleBand()
      .domain(range(1, hisNum + 1))
      .range([xMin, xMax]);
    const scaleY = scaleBand()
      .domain(range(1, hisNum + 1))
      .range([yMin, yMax]);
    const matrix = [];
    for (let i = 1; i <= hisNum; i++) {
      for (let j = 1; j <= hisNum; j++) {
        const count = binMap.get(`${i},${j}`) || 0;
        if (count > 0) {
          const x = scaleX(i) + stepX / 2;
          const y = scaleY(j) + stepY / 2;
          matrix.push({ x, y, count });
        }
      }
    }

    controller.enqueue(
      encoder.encode(
        `event: scatter\ndata: ${JSON.stringify({
          mode: "binned",
          metric: [xMetric, yMetric],
          data: matrix,
          xrange: [xMin, xMax],
          yrange: [yMin, yMax],
          stepX,
          stepY,
        })}\n\n`
      )
    );

    return 1;
  } else {
    // --- RAW POINTS SCATTER ---
    const rawPoints = await client.query(
      `
            SELECT event_ma_id, ${xMetric} AS x, ${yMetric} AS y
            FROM ${tempTableName}
            WHERE ${xMetric} IS NOT NULL AND ${yMetric} IS NOT NULL;
          `
    );

    controller.enqueue(
      encoder.encode(
        `event: scatter\ndata: ${JSON.stringify({
          mode: "raw",
          metric: [xMetric, yMetric],
          data: rawPoints.rows,
        })}\n\n`
      )
    );
    return 2;
  }
}
