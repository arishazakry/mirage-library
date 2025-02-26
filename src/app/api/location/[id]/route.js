export async function GET(req, { params }) {
  const { id } = params;
  try {
    const result = await esClient.get({
      index: "location",
      id,
    });

    return NextResponse.json(result._source);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
