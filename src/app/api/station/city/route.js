import { NextResponse } from "next/server";
import pgPool from "../../config/postgresql";

export async function GET() {
  try {
    const client = await pgPool.connect(); // Get a client from the pool

    const query = `SELECT * FROM station_by_country`; // Query the view
    const { rows } = await client.query(query);

    client.release(); // Release the client

    return NextResponse.json(rows); // Return data as JSON
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stations" },
      { status: 500 }
    );
  }
}
