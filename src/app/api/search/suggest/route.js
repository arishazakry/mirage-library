// app/api/search/suggest/route.js
import { NextResponse } from "next/server";
import esClient from "../../config/elasticsearch";

export async function POST(request) {
  try {
    const body = await request.json();
    let { field, category, query, size = 10 } = body;

    if (!field || !query) {
      return NextResponse.json(
        { error: "Field and query parameters are required" },
        { status: 400 }
      );
    }
    field = field.toLowerCase();
    // Create completion suggester query
    const searchResult = await esClient.search({
      index: category.toLowerCase() + "s",
      body: {
        size: 0,
        suggest: {
          text: query,
          completion_suggestion: {
            prefix: query,
            completion: {
              field: `${field}_suggest`,
              size: size,
              skip_duplicates: true,
              fuzzy: {
                fuzziness: "AUTO",
                min_length: 3,
              },
            },
          },
          term_suggestion: {
            text: query,
            term: {
              field: field,
              suggest_mode: "popular",
              size: size,
            },
          },
        },
        // Also search for exact and partial matches
        query: {
          bool: {
            should: [
              {
                match_phrase_prefix: {
                  [field]: {
                    query: query,
                    max_expansions: 10,
                  },
                },
              },
              {
                wildcard: {
                  [`${field}.keyword`]: {
                    value: `*${query}*`,
                  },
                },
              },
              //   {
              //     match: {
              //       [`${field}.keyword`]: {
              //         query: query,
              //         fuzziness: "AUTO",
              //         operator: "and",
              //       },
              //     },
              //   },
            ],
          },
        },
        // Return unique values only
        collapse: {
          field: `${field}.keyword`,
        },
        // Add aggregation to get popular terms
        aggs: {
          popular_terms: {
            terms: {
              field: `${field}.keyword`,
              size: size,
            },
          },
        },
      },
    });

    // Process and combine results from different sources
    const suggestions = new Set();

    // Add completion suggestions
    if (searchResult.suggest?.completion_suggestion?.[0]?.options) {
      searchResult.suggest.completion_suggestion[0].options.forEach(
        (option) => {
          suggestions.add(option.text);
        }
      );
    }

    // Add term suggestions
    if (searchResult.suggest?.term_suggestion?.[0]?.options) {
      searchResult.suggest.term_suggestion[0].options.forEach((option) => {
        suggestions.add(option.text);
      });
    }

    // Add exact and fuzzy matches
    if (searchResult.hits?.hits) {
      searchResult.hits.hits.forEach((hit) => {
        suggestions.add(hit._source[field]);
      });
    }

    // Add popular terms from aggregations
    if (searchResult.aggregations?.popular_terms?.buckets) {
      searchResult.aggregations.popular_terms.buckets.forEach((bucket) => {
        suggestions.add(bucket.key);
      });
    }
    return NextResponse.json({
      suggestions: Array.from(suggestions)
        .slice(0, size)
        .map((text) => ({ text })),
    });
  } catch (error) {
    console.error("Elasticsearch error:", error);

    // Handle specific Elasticsearch errors
    if (error.name === "ConnectionError") {
      return NextResponse.json(
        { error: "Unable to connect to search service" },
        { status: 503 }
      );
    }

    if (error.name === "ResponseError" && error.meta?.body?.error) {
      // Log detailed Elasticsearch error for debugging
      console.error("Elasticsearch response error:", error.meta.body.error);

      return NextResponse.json(
        { error: "Invalid search parameters" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: Handle preflight requests
export async function OPTIONS(request) {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
