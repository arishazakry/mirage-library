import { NextResponse } from "next/server";
import { getQuery } from "../../search/route.js";
import pgPool from "../../config/postgresql.js";
import { metricList } from "@/lib/utils.js";
import { rangeFilterMap } from "../../filters/available/route.js";

export const revalidate = 60;

export async function POST(req) {
  let client;
  try {
    const body = await req.json();
    let { ids, query, filters, sortBy, sortOrder = "ASC", metrics } = body;

    const validMetrics = new Set(metricList.map((d) => d.key));
    metrics =
      metrics?.filter((m) => validMetrics.has(m)) ||
      metricList.map((d) => d.key);

    const values = [];
    const hisNum = 20;
    const metricCols = metrics.map((m) => `${m}`).join(", ");

    // Base filtered_data CTE from materialized view
    let baseQuery = `WITH filtered_data  AS MATERIALIZED (
      SELECT 
        event_ma_id, artist_sp_genre, artist_wd_country, track_sp_key, ${metricCols}
      FROM event_flat`;

    if (ids) {
      values.push(ids);
      baseQuery += ` WHERE event_ma_id = ANY($1)
    )`;
    } else {
      const {
        whereClause,
        searchClause,
        values: qv,
      } = getQuery(sortBy, sortOrder, filters, query);
      values.push(...qv);
      baseQuery += ` ${whereClause} ${searchClause}
    )`;
    }

    // Histogram generation
    const histogramQueries = metrics
      .map((metric) => {
        const [min, max] = rangeFilterMap[metric]?.range ?? [0, 1];
        return `
          SELECT 
            '${metric}' AS metric,
            width_bucket(${metric}, ${min}, ${max}, ${hisNum}) AS bucket,
            COUNT(*) AS count
          FROM filtered_data
          GROUP BY 1, 2
        `;
      })
      .join(" UNION ALL ");

    const finalQuery = `
      ${baseQuery},
      histograms AS (${histogramQueries}),
      grouped_histograms AS (
        SELECT 
          metric, 
          jsonb_agg(jsonb_build_object('bucket', bucket, 'count', count)) AS histogram
        FROM histograms
        GROUP BY metric
      ),
      genre_unnested AS (
  SELECT unnest(artist_sp_genre) AS genre
  FROM filtered_data
  WHERE artist_sp_genre IS NOT NULL
),
genre_counts AS (
  SELECT genre, COUNT(*) AS count
  FROM genre_unnested
  GROUP BY genre
  ORDER BY count DESC
  LIMIT 10
),
genre_ranking AS (
  SELECT jsonb_agg(jsonb_build_object('title', genre, 'count', count)) AS data
  FROM genre_counts
),

country_counts AS (
  SELECT artist_wd_country, COUNT(*) AS count
  FROM filtered_data
  WHERE artist_wd_country IS NOT NULL
  GROUP BY artist_wd_country
  ORDER BY count DESC
  LIMIT 10
),
country_ranking AS (
  SELECT jsonb_agg(jsonb_build_object('title', artist_wd_country, 'count', count)) AS data
  FROM country_counts
),

track_key_unnested AS (
  SELECT unnest(track_sp_key) AS key
  FROM filtered_data
  WHERE track_sp_key IS NOT NULL
),
track_key_counts AS (
  SELECT key, COUNT(*) AS count
  FROM track_key_unnested
  GROUP BY key
  ORDER BY count DESC
  LIMIT 10
),
track_key_ranking AS (
  SELECT jsonb_agg(jsonb_build_object('title', key, 'count', count)) AS data
  FROM track_key_counts
)

      SELECT jsonb_build_object(
        'histograms', (SELECT jsonb_object_agg(metric, histogram) FROM grouped_histograms),
        'rankings', jsonb_build_object(
          'artist_sp_genre', (SELECT data FROM genre_ranking),
          'artist_wd_country', (SELECT data FROM country_ranking),
          'track_sp_key', (SELECT data FROM track_key_ranking)
        )
      ) AS result;
    `;
    console.log(finalQuery);
    client = await pgPool.connect();
    const { rows } = await client.query(finalQuery, values);

    const result = rows?.[0]?.result;
    const data = {};
    if (result?.histograms) {
      for (const metric of metrics) {
        const range = rangeFilterMap[metric]?.range ?? [0, 1];
        const step = (range[1] - range[0]) / hisNum;

        const buckets = result.histograms[metric] ?? [];
        const bucketMap = new Map(buckets.map((d) => [d.bucket, d.count]));

        const x = Array.from({ length: hisNum }, (_, i) => [
          range[0] + i * step,
          range[0] + (i + 1) * step,
        ]);
        const y = x.map((_, i) => bucketMap.get(i + 1) || 0); // width_bucket starts at 1

        data[metric] = { x, y, xrange: range };
      }
    }

    return NextResponse.json({
      data: {
        his: data,
        rank: result?.rankings ?? {},
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
