import { NextResponse } from "next/server";
import { metricList, metricRadarList } from "@/lib/utils.js";
import { v4 as uuidv4 } from "uuid";
import pgPool from "@/app/api/config/postgresql";
import { getQuery } from "@/app/api/search/route";
import { rangeFilterMap } from "@/app/api/filters/available/route";
import { range, scaleBand } from "d3";

export async function POST(req) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();
      let client;

      try {
        const body = await req.json();
        let {
          ids,
          query,
          filters,
          sortBy,
          sortOrder = "ASC",
          metadataVariable = "artists", // artists, genres, timbres
          maxNodes = 100,
          communityDetection = false,
          threshold=1,
        } = body;
        
        filters = filters ?? {};
        query = query ?? { key: "*", value: "" };
        maxNodes = Math.min(maxNodes, 100); // Enforce max limit

        let values = [];
        let whereClause = "";

        if (ids) {
          values.push(ids);
          whereClause = "WHERE event_ma_id = ANY($1)";
        } else {
          const {
            whereClause: w,
            searchClause,
            values: qv,
          } = getQuery(sortBy, sortOrder, filters, query);
          values.push(...qv);
          whereClause = `${w || ""} ${searchClause || ""}`.trim();
        }

        client = await pgPool.connect();

        const tempTableName = `temp_filtered_data_network_${uuidv4().replace(
          /-/g,
          "_"
        )}`;

        // Create temp table with all necessary columns
        await client.query(
          `CREATE TEMP TABLE ${tempTableName} AS
           SELECT event_ma_id,
           track_sp_id,
           artist_sp_id,
           artist_sp_name,
           artist_sp_genre
           FROM event_flat ${whereClause};`,
          values
        );

        await client.query(`ANALYZE ${tempTableName}`);

        await getNetwork(
          client,
          tempTableName,
          threshold,
          metadataVariable,
          maxNodes,
          communityDetection,
          controller,
          encoder
        );

        const timeTaken = Date.now() - startTime;
        controller.enqueue(
          encoder.encode(
            `event: done\ndata: {"executionTime": "${timeTaken}ms"}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`
          )
        );
        controller.close();
      } finally {
        try {
          client?.release();
        } catch {}
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function getNetwork(
  client,
  tempTableName,
  threshold = 1,
  metadataVariable = "artists",
  maxNodes = 100,
  communityDetection = false,
  controller,
  encoder
) {
  let query = "";
  
  switch (metadataVariable) {
    case "artists":
      query = getArtistNetworkQuery(tempTableName, maxNodes);
      break;
    case "genres":
      query = getGenreNetworkQuery(tempTableName, maxNodes);
      break;
    case "timbres":
      query = getTimbreNetworkQuery(tempTableName, maxNodes);
      break;
    default:
      throw new Error(`Unsupported metadata variable: ${metadataVariable}`);
  }

  const res = await client.query(query, []);
  const data = {
    nodes: [],
    edges: [],
  };

  for (const row of res.rows) {
    data[row.type] = row.data || [];
  }

  // Apply community detection if requested
  if (communityDetection && data.nodes.length > 0 && data.edges.length > 0) {
    data.communities = await detectCommunities(data.nodes, data.edges);
    // Add community info to nodes
    data.nodes = data.nodes.map(node => ({
      ...node,
      community: data.communities[node.id] || 0
    }));
  }

  controller.enqueue(
    encoder.encode(
      `event: network\ndata: ${JSON.stringify({
      // `event: network_${metadataVariable}\ndata: ${JSON.stringify({
        mode: "network",
        metric: metadataVariable,
        data,
        parameters: {
          maxNodes,
          communityDetection,
          metadataVariable
        }
      })}\n\n`
    )
  );
}

function getArtistNetworkQuery(tempTableName, maxNodes) {
  return `
    WITH top_artists AS (
      SELECT artist_sp_id, artist_sp_name, artist_sp_genre, COUNT(*) AS size
      FROM ${tempTableName}
      WHERE artist_sp_id IS NOT NULL
      GROUP BY artist_sp_id, artist_sp_name, artist_sp_genre
      ORDER BY COUNT(*) DESC
      LIMIT ${maxNodes}
    ),
    artist_genre AS (
      SELECT artist_sp_id, artist_sp_name, UNNEST(artist_sp_genre) AS genre
      FROM top_artists
    ),
    artist_pairs AS (
      SELECT
        a1.artist_sp_id AS source,
        a2.artist_sp_id AS target,
        COUNT(*) AS weight
      FROM artist_genre a1
      JOIN artist_genre a2
        ON a1.genre = a2.genre AND a1.artist_sp_id < a2.artist_sp_id
      GROUP BY source, target
    )
    SELECT
      'nodes' AS type,
      json_agg(
        json_build_object(
          'id', ta.artist_sp_id,
          'label', ta.artist_sp_name,
          'size', ta.size,
          'genres', ta.artist_sp_genre
        )
      ) AS data
    FROM top_artists ta

    UNION ALL

    SELECT
      'edges' AS type,
      json_agg(
        json_build_object(
          'source', source,
          'target', target,
          'weight', weight
        )
      ) AS data
    FROM artist_pairs
    WHERE weight > 0;
  `;
}

function getGenreNetworkQuery(tempTableName, maxNodes) {
  return `
    WITH genre_expanded AS (
      SELECT UNNEST(track_sp_genre) AS genre, event_ma_id
      FROM ${tempTableName}
      WHERE track_sp_genre IS NOT NULL AND array_length(track_sp_genre, 1) > 0
    ),
    top_genres AS (
      SELECT genre, COUNT(*) AS size
      FROM genre_expanded
      GROUP BY genre
      ORDER BY COUNT(*) DESC
      LIMIT ${maxNodes}
    ),
    genre_cooccurrence AS (
      SELECT
        g1.genre AS source,
        g2.genre AS target,
        COUNT(*) AS weight
      FROM genre_expanded g1
      JOIN genre_expanded g2
        ON g1.event_ma_id = g2.event_ma_id AND g1.genre < g2.genre
      WHERE g1.genre IN (SELECT genre FROM top_genres)
        AND g2.genre IN (SELECT genre FROM top_genres)
      GROUP BY g1.genre, g2.genre
    )
    SELECT
      'nodes' AS type,
      json_agg(
        json_build_object(
          'id', genre,
          'label', genre,
          'size', size
        )
      ) AS data
    FROM top_genres

    UNION ALL

    SELECT
      'edges' AS type,
      json_agg(
        json_build_object(
          'source', source,
          'target', target,
          'weight', weight
        )
      ) AS data
    FROM genre_cooccurrence
    WHERE weight > 0;
  `;
}

function getTimbreNetworkQuery(tempTableName, maxNodes) {
  return `
    WITH timbre_expanded AS (
      SELECT UNNEST(track_sp_timbre) AS timbre, event_ma_id
      FROM ${tempTableName}
      WHERE track_sp_timbre IS NOT NULL AND array_length(track_sp_timbre, 1) > 0
    ),
    top_timbres AS (
      SELECT timbre, COUNT(*) AS size
      FROM timbre_expanded
      GROUP BY timbre
      ORDER BY COUNT(*) DESC
      LIMIT ${maxNodes}
    ),
    timbre_cooccurrence AS (
      SELECT
        t1.timbre AS source,
        t2.timbre AS target,
        COUNT(*) AS weight
      FROM timbre_expanded t1
      JOIN timbre_expanded t2
        ON t1.event_ma_id = t2.event_ma_id AND t1.timbre < t2.timbre
      WHERE t1.timbre IN (SELECT timbre FROM top_timbres)
        AND t2.timbre IN (SELECT timbre FROM top_timbres)
      GROUP BY t1.timbre, t2.timbre
    )
    SELECT
      'nodes' AS type,
      json_agg(
        json_build_object(
          'id', timbre,
          'label', timbre,
          'size', size
        )
      ) AS data
    FROM top_timbres

    UNION ALL

    SELECT
      'edges' AS type,
      json_agg(
        json_build_object(
          'source', source,
          'target', target,
          'weight', weight
        )
      ) AS data
    FROM timbre_cooccurrence
    WHERE weight > 0;
  `;
}

// Simple community detection using modularity-based clustering
async function detectCommunities(nodes, edges) {
  // Create adjacency list
  const adjacencyList = {};
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  
  edges.forEach(edge => {
    if (adjacencyList[edge.source] && adjacencyList[edge.target]) {
      adjacencyList[edge.source].push({ node: edge.target, weight: edge.weight });
      adjacencyList[edge.target].push({ node: edge.source, weight: edge.weight });
    }
  });

  // Simple greedy modularity optimization (Louvain-like approach)
  const communities = {};
  let communityId = 0;
  
  // Initialize each node in its own community
  nodes.forEach(node => {
    communities[node.id] = communityId++;
  });
  
  let improved = true;
  let iterations = 0;
  const maxIterations = 10;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    for (const node of nodes) {
      const nodeId = node.id;
      const currentCommunity = communities[nodeId];
      
      // Find neighboring communities and their connection strengths
      const neighboringCommunities = {};
      
      adjacencyList[nodeId].forEach(neighbor => {
        const neighborCommunity = communities[neighbor.node];
        if (neighborCommunity !== currentCommunity) {
          neighboringCommunities[neighborCommunity] = 
            (neighboringCommunities[neighborCommunity] || 0) + neighbor.weight;
        }
      });
      
      // Find the community with the strongest connection
      let bestCommunity = currentCommunity;
      let bestScore = 0;
      
      Object.entries(neighboringCommunities).forEach(([community, score]) => {
        if (score > bestScore) {
          bestScore = score;
          bestCommunity = parseInt(community);
        }
      });
      
      if (bestCommunity !== currentCommunity) {
        communities[nodeId] = bestCommunity;
        improved = true;
      }
    }
  }
  
  return communities;
}