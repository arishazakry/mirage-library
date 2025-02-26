import { NextResponse } from "next/server";
import esClient from "../config/elasticsearch";
import pgPool from "../config/postgresql";

export async function GET(req) {
  try {
    const result = await esClient.search({
      index: "location",
      body: {
        query: { match_all: {} },
        size: 100, // Giới hạn số bản ghi trả về
      },
    });

    return NextResponse.json(result.hits.hits);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
