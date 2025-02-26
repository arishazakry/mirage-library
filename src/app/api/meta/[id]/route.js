import { NextResponse } from "next/server";
import pgPool from "../../config/postgresql.js";

export const revalidate = 60;

export async function GET(req, context) {
  let client;
  try {
    // Await params to avoid undefined error
    const { id } = await context.params;
    // const sql = `
    //     SELECT
    //       e.*,
    //       l.location_rg_city,
    //       l.location_rg_country,
    //       s.station_ar_genre,
    //       s.station_rg_name,
    //       t.track_sp_name,
    //       t.track_sp_preview_url,
    //       t.track_sp_external_url,
    //       a.artist_sp_name,
    //       a.artist_sp_followers,
    //       a.artist_sp_genres,
    //       a.artist_sp_popularity,
    //       a.artist_sp_external_url
    //     FROM event e
    //     INNER JOIN location l ON e.location_rg_id = l.location_rg_id
    //     INNER JOIN station s ON e.station_rg_id = s.station_rg_id
    //     INNER JOIN track t ON e.track_sp_id = t.track_sp_id
    //     LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
    //     WHERE e.event_ma_id = $1
    //   `;

    const sql = `
        SELECT 
          e.*,
          l.location_rg_city,
          l.location_rg_country,
          l.location_rg_longitude,
          l.location_rg_latitude,
          s.station_ar_genre,
          s.station_rg_name,
          t.*,
          a.*
        FROM event e
        INNER JOIN location l ON e.location_rg_id = l.location_rg_id
        INNER JOIN station s ON e.station_rg_id = s.station_rg_id
        INNER JOIN track t ON e.track_sp_id = t.track_sp_id
        LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
        WHERE e.event_ma_id = $1
      `;
    client = await pgPool.connect();
    const { rows } = await client.query(sql, [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error("Error fetching event details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
