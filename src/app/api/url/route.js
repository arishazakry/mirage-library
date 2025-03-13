import { NextResponse } from "next/server";
import pgPool from "../config/postgresql.js";
import checkAPIKey from "@/lib/utils";
export const revalidate = 60;
// POST: Create a shortened URL
export async function POST(req) {
  let client;
  try {
    const { data } = await req.json();

    // Validate API key
    const apiKeyValid = await checkAPIKey(req);
    if (!apiKeyValid)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Store URL data
    client = await pgPool.connect();

    // Check if data already exists
    const existing = await client.query("SELECT * FROM urls WHERE data = $1", [
      data,
    ]);
    let result;
    if (existing.rows.length > 0) result = existing.rows[0];
    else {
      // Insert new data if not exists
      const Insresult = await client.query(
        "INSERT INTO urls (data) VALUES ($1) RETURNING *",
        [data]
      );
      result = result.rows[0];
    }
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Retrieve a shortened URL
export async function GET(req, { params }) {
  let client;
  try {
    const { id } = params;

    // Validate API key
    const apiKeyValid = await checkAPIKey(req);
    if (!apiKeyValid)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    client = await pgPool.connect();
    const result = await pool.query("SELECT * FROM urls WHERE id = $1", [id]);
    if (result.rows.length === 0) throw new Error("Record not found");

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
