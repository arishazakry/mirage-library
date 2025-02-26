import { NextResponse } from "next/server";
import pgPool from "../../config/postgresql";

export async function GET() {
  const client = await pgPool.connect(); // Get a client from the pool
  try {
    const stationQuery = `SELECT DISTINCT station_rg_name FROM station;`;
    const genreQuery = `SELECT DISTINCT station_ar_genre FROM station;`;

    const [stationResult, genreResult] = await Promise.all([
      client.query(stationQuery),
      client.query(genreQuery),
    ]);
    return NextResponse.json({
      station_rg_name: stationResult.rows.map((row) => row.station_rg_name),
      station_ar_genre: genreResult.rows.map((row) => row.station_ar_genre),
    }); // Return data as JSON
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stations" },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
