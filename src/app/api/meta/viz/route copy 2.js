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

    // Get one client connection and use it throughout
    client = await pgPool.connect();

    // Set a statement timeout to prevent long-running queries
    await client.query("SET statement_timeout = 15000"); // 15 seconds timeout

    // Build the base filter conditions
    let values = [];
    let baseFilterCondition = "";

    if (ids) {
      values = [ids];
      baseFilterCondition = "WHERE e.event_ma_id = ANY($1)";
    } else {
      let {
        whereClause,
        searchClause,
        values: qv,
      } = getQuery(sortBy, sortOrder, filters, query);
      values = qv;
      baseFilterCondition = `${whereClause} ${searchClause}`;
    }

    // Prepare a more efficient single query with fewer joins and less nested CTEs
    const sqlQuery = `
    WITH filtered_data AS (
      SELECT 
        e.event_ma_id,
        a.artist_sp_genre,
        a.artist_wd_country,
        t.track_sp_key,
        ${metrics.map((d) => `t.${d}`).join(", ")}
      FROM event e
      ${
        ids
          ? ""
          : "INNER JOIN location l ON e.location_rg_id = l.location_rg_id"
      }
      ${ids ? "" : "INNER JOIN station s ON e.station_rg_id = s.station_rg_id"}
      INNER JOIN track t ON e.track_sp_id = t.track_sp_id
      LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
      ${baseFilterCondition}
    ),
    
    -- Histograms (one per metric, but more efficient)
    ${metrics
      .map((metric, idx) => {
        const range = rangeFilterMap[metric]?.range ?? [0, 1];
        const hisNum = 20;
        return `
      histogram_${metric.replace(/\./g, "_")} AS (
        SELECT 
          '${metric}' AS metric,
          width_bucket(${metric}, ${range[0]}, ${
          range[1]
        }, ${hisNum}) AS bucket,
          COUNT(*) AS count
        FROM filtered_data
        GROUP BY bucket
      )${idx < metrics.length - 1 ? "," : ""}`;
      })
      .join("\n")}
    
    -- Select statement that returns everything at once
    SELECT
      -- Genre ranking
      (SELECT jsonb_agg(jsonb_build_object('title', genre, 'count', count))
       FROM (
         SELECT genre, COUNT(*) AS count
         FROM filtered_data, LATERAL unnest(artist_sp_genre) AS genre
         GROUP BY genre
         ORDER BY count DESC
         LIMIT 10
       ) genre_counts) AS genre_ranking,
      
      -- Country ranking
      (SELECT jsonb_agg(jsonb_build_object('title', artist_wd_country, 'count', count))
       FROM (
         SELECT artist_wd_country, COUNT(*) AS count
         FROM filtered_data
         WHERE artist_wd_country IS NOT NULL
         GROUP BY artist_wd_country
         ORDER BY count DESC
         LIMIT 10
       ) country_counts) AS country_ranking,
      
      -- Track key ranking
      (SELECT jsonb_agg(jsonb_build_object('title', key, 'count', count))
       FROM (
         SELECT key, COUNT(*) AS count
         FROM filtered_data, LATERAL unnest(track_sp_key) AS key
         GROUP BY key
         ORDER BY count DESC
         LIMIT 10
       ) key_counts) AS track_key_ranking,
      
      -- Histograms
      ${metrics
        .map((metric) => {
          const safeMetric = metric.replace(/\./g, "_");
          return `(SELECT jsonb_agg(jsonb_build_object('bucket', bucket, 'count', count))
                FROM histogram_${safeMetric}) AS histogram_${safeMetric}`;
        })
        .join(",\n")}
    `;

    // Execute the optimized single query
    const { rows } = await client.query(sqlQuery, values);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ data: { his: {}, rank: {} } });
    }

    // Process rankings
    const rankings = {
      artist_sp_genre: rows[0].genre_ranking || [],
      artist_wd_country: rows[0].country_ranking || [],
      track_sp_key: rows[0].track_key_ranking || [],
    };

    // Process histograms
    const histogramData = {};
    metrics.forEach((metric) => {
      const safeMetric = metric.replace(/\./g, "_");
      const histogramKey = `histogram_${safeMetric}`;
      const histogramRows = rows[0][histogramKey] || [];
      const range = rangeFilterMap[metric]?.range ?? [0, 1];
      const hisNum = 20;
      const wb = (range[1] - range[0]) / hisNum;

      // Create bucket mapping
      const bucketMap = {};
      histogramRows.forEach((row) => {
        bucketMap[row.bucket] = Number(row.count);
      });

      // Generate x and y values
      const x = Array.from({ length: hisNum + 1 }, (_, i) => [
        range[0] + (i - 1) * wb,
        range[0] + i * wb,
      ]);
      x.push([range[1], range[1] + wb]);

      const y = x.map((_, i) => bucketMap[i] ?? 0);
      histogramData[metric] = { x, y, xrange: range };
    });

    return NextResponse.json({
      data: { his: histogramData, rank: rankings },
    });
  } catch (error) {
    console.error("Error in analytics/metrics API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
