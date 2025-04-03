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
    if (!metrics) {
      metrics = metricList.map((d) => d.key);
    }
    let values = [];
    let sqlFilter = `WITH filtered_data AS (
    SELECT e.*,a.artist_sp_genre, a.artist_wd_country, t.track_sp_key, ${metrics
      .map((d) => `t.${d}`)
      .join(", ")}
    FROM event e`;

    if (ids) {
      values = [ids];
      sqlFilter += `
        INNER JOIN track t ON e.track_sp_id = t.track_sp_id
        LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
        WHERE e.event_ma_id = ANY($1)
      )`;
    } else {
      // Allowed columns for sorting (to prevent SQL injection)
      let {
        whereClause,
        searchClause,
        values: qv,
      } = getQuery(sortBy, sortOrder, filters, query);
      values = qv;
      sqlFilter += `
          INNER JOIN location l ON e.location_rg_id = l.location_rg_id
          INNER JOIN station s ON e.station_rg_id = s.station_rg_id
          INNER JOIN track t ON e.track_sp_id = t.track_sp_id
          LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
          ${whereClause} ${searchClause}
        )`;
    }
    // Generate histogram queries for multiple metrics
    const hisNum = 20;
    sqlFilter +=
      `, histograms AS (
    ` +
      metrics
        .map((metric, index) => {
          const range = rangeFilterMap[metric]?.range ?? [0, 1];
          return `
      SELECT '${metric}' AS metric, width_bucket(${metric}, ${range[0]}, ${range[1]}, ${hisNum}) AS bucket, COUNT(*) AS count
      FROM filtered_data
      GROUP BY metric, bucket
    `;
        })
        .join(" UNION ALL") +
      `
    ),
grouped_histograms AS (
    SELECT metric, jsonb_agg(jsonb_build_object('bucket', bucket, 'count', count)) AS histogram
    FROM histograms
    GROUP BY metric
),

-- Top 10 Rankings (Separate Queries)
genre_ranking AS (
    SELECT genre AS value, COUNT(*) AS count
    FROM filtered_data, LATERAL unnest(artist_sp_genre) AS genre
    GROUP BY genre
    ORDER BY count DESC
    LIMIT 10
),

country_ranking AS (
    SELECT artist_wd_country AS value, COUNT(*) AS count
    FROM filtered_data
    WHERE artist_wd_country IS NOT NULL
    GROUP BY artist_wd_country
    ORDER BY count DESC
    LIMIT 10
),

track_key_ranking AS (
    SELECT key AS value, COUNT(*) AS count
    FROM filtered_data, LATERAL unnest(track_sp_key) AS key
    GROUP BY key
    ORDER BY count DESC
    LIMIT 10
),

-- Final Selection (Avoid Nested Aggregates)
final_histogram AS (
    SELECT jsonb_object_agg(metric, histogram) AS histogram_data FROM grouped_histograms
),

final_genre AS (
    SELECT jsonb_agg(jsonb_build_object('title', value, 'count', count)) AS genre_data FROM genre_ranking
),

final_country AS (
    SELECT jsonb_agg(jsonb_build_object('title', value, 'count', count)) AS country_data FROM country_ranking
),

final_track_key AS (
    SELECT jsonb_agg(jsonb_build_object('title', value, 'count', count)) AS track_key_data FROM track_key_ranking
)

-- Final JSON Output
SELECT jsonb_build_object(
    'histograms', (SELECT histogram_data FROM final_histogram),
    'rankings', jsonb_build_object(
        'artist_sp_genre', (SELECT genre_data FROM final_genre),
        'artist_wd_country', (SELECT country_data FROM final_country),
        'track_sp_key', (SELECT track_key_data FROM final_track_key)
    )
) AS result;`;
    client = await pgPool.connect();
    const { rows } = await client.query(sqlFilter, values);
    const data = {};
    if (rows && rows[0]) {
      const his = rows[0].result.histograms;
      Object.keys(his).forEach((metric) => {
        const range = rangeFilterMap[metric]?.range ?? [0, 1];
        const wb = (range[1] - range[0]) / hisNum;
        const x = Array.from({ length: hisNum + 1 }, (_, i) => [
          range[0] + (i - 1) * wb,
          range[0] + i * wb,
        ]);
        x.push([range[1], range[1] + wb]);
        const bucket = {};
        his[metric].forEach((d) => {
          bucket[d.bucket] = d.count;
        });
        const y = x.map((d, i) => bucket[i] ?? 0);
        data[metric] = { x, y, xrange: range };
      });
    }
    return NextResponse.json({
      data: { his: data, rank: rows?.[0]?.result?.rankings ?? {} },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
