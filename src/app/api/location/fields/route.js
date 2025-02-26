import { NextResponse } from "next/server";
import pgPool from "../../config/postgresql";

export async function GET() {
  const client = await pgPool.connect(); // Get a client from the pool
  try {
    const locationQuery = `SELECT DISTINCT location_rg_city FROM location;`;
    const genreQuery = `SELECT DISTINCT location_rg_country FROM location;`;

    const [locationResult, genreResult] = await Promise.all([
      client.query(locationQuery),
      client.query(genreQuery),
    ]);
    return NextResponse.json({
      location_rg_city: locationResult.rows.map((row) => row.location_rg_city),
      location_rg_country: genreResult.rows.map(
        (row) => row.location_rg_country
      ),
    }); // Return data as JSON
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  } finally {
    if (client) client.release();
  }
}
