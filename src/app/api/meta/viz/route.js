import { NextResponse } from "next/server";
import { getQuery } from "../../search/route.js";
import pgPool from "../../config/postgresql.js";

export const revalidate = 60;

export async function POST(req) {
  let client;
  try {
    const body = await req.json();
    const { ids, query, filters, sortBy, sortOrder = "ASC" } = body;
    let values = [];
    let sql = "";
    if (ids) {
      values = [ids];
      sql = `
        SELECT 
          e.*, 
          t.*, 
          a.artist_sp_name AS artist_sp_name,
          a.artist_sp_followers AS artist_sp_followers,
          a.artist_sp_popularity AS artist_sp_popularity,
          a.artist_sp_genre AS artist_sp_genre,
          a.artist_wd_country AS artist_wd_country
        FROM event e
        INNER JOIN track t ON e.track_sp_id = t.track_sp_id
        LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
        WHERE e.event_ma_id = ANY($1)
        LIMIT 10000
      `;
    } else {
      // Allowed columns for sorting (to prevent SQL injection)
      let {
        whereClause,
        searchClause,
        values: qv,
      } = getQuery(sortBy, sortOrder, filters, query);
      values = qv;
      sql = `
          SELECT e.*, 
            t.*, 
            a.artist_sp_name AS artist_sp_name,
            a.artist_sp_followers AS artist_sp_followers,
            a.artist_sp_popularity AS artist_sp_popularity,
            a.artist_sp_genre AS artist_sp_genre,
            a.artist_wd_country AS artist_wd_country
          FROM event e
          INNER JOIN location l ON e.location_rg_id = l.location_rg_id
          INNER JOIN station s ON e.station_rg_id = s.station_rg_id
          INNER JOIN track t ON e.track_sp_id = t.track_sp_id
          LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
          ${whereClause} ${searchClause}
          LIMIT 10000
        `;
    }
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
