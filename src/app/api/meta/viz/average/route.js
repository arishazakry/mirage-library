import { NextResponse } from "next/server";
import { metricRadarList } from "@/lib/utils";
import pgPool from "@/app/api/config/postgresql.js";
import { getQuery } from "@/app/api/search/route";

export async function POST(req) {
  let client;
  try {
    const body = await req.json();
    let { ids, query, filters, sortBy, sortOrder = "ASC", metrics } = body;

    if (!metrics) {
      metrics = metricRadarList.map((d) => d.key);
    }
    let values = [];
    let sqlFilter = `WITH filtered_data AS (
    SELECT e.*,a.artist_sp_genre, a.artist_wd_country, t.track_sp_key, ${metrics
      .map((d) => `t.${d}`)
      .join(", ")}
    FROM event e`;

    if (ids) {
      values = [ids];
      sqlFilter += `
        INNER JOIN track t ON e.track_sp_id = t.track_sp_id
        LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
        WHERE e.event_ma_id = ANY($1)
      )`;
    } else {
      let {
        whereClause,
        searchClause,
        values: qv,
      } = getQuery(sortBy, sortOrder, filters, query);
      values = qv;
      sqlFilter += `
              INNER JOIN location l ON e.location_rg_id = l.location_rg_id
              INNER JOIN station s ON e.station_rg_id = s.station_rg_id
              INNER JOIN track t ON e.track_sp_id = t.track_sp_id
              LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
              ${whereClause} ${searchClause}
            )`;
    }
    sqlFilter +=
      "SELECT " +
      metrics
        .map((metric, index) => `AVG (${metric}) as ${metric}`)
        .join(", \n") +
      " FROM filtered_data;";
    client = await pgPool.connect();
    console.log(sqlFilter);
    const { rows } = await client.query(sqlFilter, values);
    return NextResponse.json({
      data: { avg: rows },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
