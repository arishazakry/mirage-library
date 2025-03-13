import { NextResponse } from "next/server";
import esClient from "../config/elasticsearch.js";

export const revalidate = 60;

export async function POST(req) {
  try {
    const body = await req.json();
    const { query, indices, filters, autocomplete, from = 0, size = 50 } = body;

    if (!indices) {
      return NextResponse.json(
        { error: "Indices are required" },
        { status: 400 }
      );
    }

    const indexList = indices.split(",");
    let filterConditions = [];

    if (filters) {
      try {
        const parsedFilters = JSON.parse(filters);
        filterConditions = Object.entries(parsedFilters).map(([key, value]) => {
          if (Array.isArray(value)) {
            return { terms: { [key]: value } };
          }
          if (typeof value === "object" && value !== null) {
            const rangeQuery = {};
            Object.entries(value).forEach(([op, val]) => {
              rangeQuery[op] = val;
            });
            return { range: { [key]: rangeQuery } };
          }
          return { term: { [key]: value } };
        });
      } catch (e) {
        return NextResponse.json(
          { error: "Invalid filters format" },
          { status: 400 }
        );
      }
    }

    let queryBody = {
      bool: {
        must: [],
        filter: filterConditions,
      },
    };

    if (query) {
      if (autocomplete) {
        queryBody.bool.must.push({
          multi_match: {
            query,
            fields: [
              "name^3",
              "description^2",
              "title^3",
              "station_rg_name^4",
              "track_sp_name^4",
              "location_rg_city^2",
            ],
            type: "phrase_prefix",
          },
        });
      } else {
        queryBody.bool.must.push({
          multi_match: {
            query,
            fields: ["station_rg_name", "track_sp_name", "location_rg_city"],
          },
        });
      }
    }

    let _sourceFields = [];

    if (indices.includes("events")) {
      _sourceFields.push(
        "artist_sp_id",
        "track_sp_id",
        "artist_sp_name",
        "track_sp_name",
        "location_rg_id",
        "location_rg_city",
        "location_rg_country",
        "station_rg_id",
        "station_ar_genre",
        "station_rg_name",
        "event_ma_timestation"
      );
    }

    const esResult = await esClient.search({
      index: indexList,
      body: {
        query: queryBody,
        _source: _sourceFields,
        size,
        from,
        track_total_hits: false,
      },
    });

    let results = esResult.hits.hits;

    if (indices.includes("events")) {
      const trackIds = results
        .map((r) => r._source.track_sp_id)
        .filter(Boolean);
      const artistIds = results
        .map((r) => r._source.artist_sp_id)
        .filter(Boolean);
      const [tracksData, artistsData] = await Promise.all([
        esClient.search({
          index: "tracks",
          body: {
            query: { terms: { track_sp_id: trackIds } },
            _source: ["track_sp_id", "track_sp_name"],
            size: trackIds.length,
          },
        }),
        esClient.search({
          index: "artists",
          body: {
            query: { terms: { "artist_sp_id.keyword": artistIds } },
            _source: ["artist_sp_id", "artist_sp_name"],
            size: artistIds.length,
          },
        }),
      ]);
      const trackMap = Object.fromEntries(
        tracksData.hits.hits.map((t) => [t._source.track_sp_id, t._source])
      );
      const artistMap = Object.fromEntries(
        artistsData.hits.hits.map((a) => [a._source.artist_sp_id, a._source])
      );

      results = results.map((event) => {
        const _source = {
          ...event._source,
          ...(trackMap[event._source.track_sp_id] || {}),
          ...(artistMap[event._source.artist_sp_id] || {}),
        };
        delete _source.artist_sp_id;
        return {
          ...event,
          _source,
        };
      });
    }

    return NextResponse.json({
      elasticsearch: results,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
