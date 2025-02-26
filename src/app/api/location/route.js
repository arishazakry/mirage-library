import { NextResponse } from "next/server";
import pgPool from "../config/postgresql";

export async function GET() {
  const client = await pgPool.connect();
  try {
    const query = `
      SELECT 
        location_rg_id, 
        location_rg_city, 
        location_rg_country, 
        location_rg_latitude, 
        location_rg_longitude 
      FROM location;
    `;

    const result = await client.query(query);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error("Error fetching location info:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
