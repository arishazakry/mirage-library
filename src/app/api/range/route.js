export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const index = searchParams.get("index");
    const fields = searchParams.get("fields");

    if (!index || !fields) {
      return NextResponse.json(
        { error: "Index and fields are required" },
        { status: 400 }
      );
    }

    const fieldArray = fields.split(",");
    const aggs = {};

    fieldArray.forEach((field) => {
      aggs[`${field}_range`] = { stats: { field } };
    });

    const esResult = await esClient.search({
      index,
      body: {
        aggs,
        size: 0,
      },
    });

    const result = {};
    fieldArray.forEach((field) => {
      result[field] = esResult.aggregations[`${field}_range`];
    });

    return NextResponse.json({ ranges: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
