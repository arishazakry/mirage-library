import { NextResponse } from "next/server";
import { pipeline } from "stream";
import { promisify } from "util";
import { Transform } from "json2csv";
import pgPool from "../config/postgresql.js";
import exportDataList from "@/store/data/mirage-mc-export.js";
import { getQuery } from "../search/route.js";

const pipelineAsync = promisify(pipeline);

export async function POST(req) {
  const client = await pgPool.connect();
  try {
    const body = await req.json();
    const { ids, filters, query } = body;

    const exportFields = exportDataList
      .filter((d) => d.export)
      .map((d) => d.variable);

    const columns = exportFields.join(", ");
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
      } = getQuery(undefined, undefined, filters, query);
      values.push(...qv);
      whereClause = `${w || ""} ${searchClause || ""}`.trim();
    }

    // Start streaming the query
    const queryStream = client.query(
      new (require("pg-query-stream"))(
        `SELECT ${columns} FROM event_flat ${whereClause}`,
        values
      )
    );

    const json2csv = new Transform({}, { objectMode: true });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        queryStream.on("data", (row) => {
          // Clean array values for CSV
          const flatRow = {};
          for (const key in row) {
            const val = row[key];
            flatRow[key] = Array.isArray(val) ? val.join(", ") : val;
          }

          if (!json2csv.write(flatRow)) {
            queryStream.pause(); // pause if buffer is full
          }
        });

        queryStream.on("end", () => {
          json2csv.end();
        });

        json2csv.on("drain", () => {
          queryStream.resume(); // resume after drain
        });

        json2csv.on("data", (chunk) => {
          controller.enqueue(encoder.encode(chunk.toString()));
        });

        json2csv.on("end", () => {
          controller.close();
        });

        json2csv.on("error", (err) => {
          controller.enqueue(encoder.encode(`ERROR: ${err.message}`));
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=\"export.csv\"",
      },
    });
  } catch (err) {
    console.error("Download CSV error:", err);
    return new NextResponse(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  } finally {
    client.release();
  }
}
