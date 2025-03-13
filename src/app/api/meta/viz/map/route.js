import pgPool from "../../../config/postgresql";
import { getQuery } from "../../../search/route";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function POST(req) {
  let client;
  try {
    const body = await req.json();
    const { query, filters, sortBy, sortOrder = "ASC" } = body;
    let values = [];
    let sql = "";

    let {
      whereClause,
      searchClause,
      values: qv,
    } = getQuery(sortBy, sortOrder, filters, query);
    values = qv;
    sql = `
         SELECT 
            e.location_rg_id,
            COUNT(*) AS event_count
        FROM event e
        INNER JOIN location l ON e.location_rg_id = l.location_rg_id
        INNER JOIN station s ON e.station_rg_id = s.station_rg_id
        INNER JOIN track t ON e.track_sp_id = t.track_sp_id
        LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
        ${whereClause} ${searchClause}
        GROUP BY e.location_rg_id
        `;

    client = await pgPool.connect();
    const { rows } = await client.query(sql, values);

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
