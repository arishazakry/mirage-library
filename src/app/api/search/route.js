import { NextResponse } from "next/server";
import pgPool from "../config/postgresql.js";

export const revalidate = 60;

const isArray = {
  station_ar_genre: true,
  artist_sp_genre: true,
  artist_wd_genre: true,
  artist_wd_instruments: true,
  artist_wd_voicetype: true,
  track_wd_instrumentation: true,
};

export async function POST(req) {
  let client;
  try {
    const body = await req.json();
    const {
      query,
      filters,
      from = 0,
      size = 50,
      sortBy,
      sortOrder = "ASC",
    } = body;
    // Allowed columns for sorting (to prevent SQL injection)
    var { whereClause, searchClause, orderClause, valueIndex, values } =
      getQuery(sortBy, sortOrder, filters, query);

    const sql = `
      SELECT e.event_ma_id,
            e.event_ma_metadataReliability,
            e.event_se_description,
            e.location_rg_id,
            e.station_rg_id,
            e.artist_sp_id,
            e.track_sp_id,
             l.location_rg_city , 
             l.location_rg_country ,
             s.station_ar_genre, 
             s.station_rg_name,
             t.track_sp_name, 
             a.artist_sp_name
      FROM event e
      INNER JOIN location l ON e.location_rg_id = l.location_rg_id
      INNER JOIN station s ON e.station_rg_id = s.station_rg_id
      INNER JOIN track t ON e.track_sp_id = t.track_sp_id
      LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
      ${whereClause} ${searchClause}
      ${orderClause}
      LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
    `;
    // , COUNT(*) OVER() AS total_count
    const countSql = `
  SELECT COUNT(*) AS total_count
  FROM event e
  INNER JOIN location l ON e.location_rg_id = l.location_rg_id
  INNER JOIN station s ON e.station_rg_id = s.station_rg_id
  INNER JOIN track t ON e.track_sp_id = t.track_sp_id
  LEFT JOIN artist a ON e.artist_sp_id = a.artist_sp_id
  ${whereClause} ${searchClause}
`;

    values.push(size, from);
    console.log(sql);
    client = await pgPool.connect();
    const { rows } = await client.query(sql, values);
    const countResult = await client.query(countSql, values.slice(0, -2));
    // const totalRowCount = rows.length > 0 ? rows[0].total_count : 0;
    const totalRowCount = countResult.rows[0].total_count;
    return NextResponse.json({ data: rows, meta: { totalRowCount } });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) client.release();
  }
}
export function getQuery(sortBy, sortOrder, filters, query) {
  const allowedSortColumns = new Set([
    "event_ma_id",
    "track_sp_name",
    "event_se_description",
    "location_rg_city",
    "location_rg_country",
    "station_rg_genre",
    "station_rg_name",
    "artist_sp_name",
  ]);

  // Default sorting
  let orderClause = "ORDER BY e.event_ma_id ASC";
  if (sortBy && allowedSortColumns.has(sortBy)) {
    const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";
    orderClause = `ORDER BY ${sortBy} ${order}`;
  }

  let whereClauses = [];
  let values = [];
  let valueIndex = 1;
  console.log(filters);
  if (filters && Object.keys(filters).length > 0) {
    for (const [key, filter] of Object.entries(filters)) {
      if (filter && typeof filter === "object" && "value" in filter) {
        if ("mode" in filter && filter.mode === "lower") {
          // Handle range filter (e.g., artist_sp_followers with "lower" mode)
          whereClauses.push(`${key} >= $${valueIndex}`);
          values.push(filter.value[0]);
        } else if ("mode" in filter && filter.mode === "greater") {
          whereClauses.push(`${key} <= $${valueIndex}`);
          values.push(filter.value[0]);
        } else if (Array.isArray(filter.value)) {
          if (filter.mode == "range") {
            whereClauses.push(
              `${key} BETWEEN $${valueIndex} AND $${valueIndex + 1}`
            );
            values.push(filter.value[0], filter.value[1]);
            valueIndex += 1;
          } else if (isArray[key]) {
            whereClauses.push(`${key}  && $${valueIndex}`);
            values.push(filter.value);
          } else {
            // Handle arrays (e.g., location_ne_country)
            whereClauses.push(`${key} = ANY($${valueIndex})`);
            values.push(filter.value);
          }
        } else {
          whereClauses.push(`${key} = $${valueIndex}`);
          values.push(filter.value);
        }
        valueIndex++;
      }
    }
  }

  let searchClause = "";
  if (query && query.value && query.key) {
    if (query.key == "*") {
      searchClause = `AND (a.artist_sp_name ILIKE $${valueIndex} OR t.track_sp_name ILIKE $${valueIndex} OR (${get_query_array(
        valueIndex,
        "s.station_ar_genre",
        "station_ar_genre"
      )}) OR e.event_ma_id ILIKE $${valueIndex})`;
    } else {
      if (query.key === "station_ar_genre")
        searchClause = `AND (${get_query_array(
          valueIndex,
          "s.station_ar_genre",
          "station_ar_genre"
        )})`;
      else
        searchClause = `AND (${query.key[0]}.${query.key} ILIKE $${valueIndex})`;
    }
    values.push(`%${query.value}%`);
    valueIndex++;
  }

  let whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  if (!whereClauses.length && searchClause.length) {
    whereClause = "WHERE ";
    searchClause = searchClause.slice(4, searchClause.length);
  }
  return { whereClause, searchClause, orderClause, valueIndex, values };
}

function get_query_array(valIndex, field, fieldAlt) {
  return `EXISTS (
    SELECT 1 
    FROM unnest(${field}) AS ${fieldAlt}
    WHERE ${fieldAlt} ILIKE $${valIndex}
  )`;
}
