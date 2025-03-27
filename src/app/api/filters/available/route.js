// app/api/filters/available/route.js
import { NextResponse } from "next/server";

// This transforms your CSV data into available filters
export const rangeFilters = [
  { type: "string", field: "location_ne_continent", label: "Continent" },
  {
    type: "string",
    field: "location_ne_country",
    label: "Country",
    default: true,
  },
  {
    type: "string",
    field: "location_ne_countryeconomy",
    label: "Country Economy",
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "location_ne_countrygdp",
    label: "Country GDP",
    range: [43.8, 21140000],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "location_ne_countrypopulation",
    label: "Country Population",
    range: [5292, 1379302771],
  },
  {
    type: "string",
    field: "location_ne_countrysovereignstate",
    label: "Country Sovereign State",
  },
  { type: "string", field: "location_ne_countrytype", label: "Country Type" },
  { type: "string", field: "location_ne_region", label: "Geographic Region" },
  {
    type: "string",
    field: "location_ne_stateprovince",
    label: "State or Province",
  },
  { type: "string", field: "location_rg_city", label: "City" },
  { type: "string", field: "location_rg_id", label: "Location ID" },
  { type: "string", field: "station_ar_form", label: "Station Form" },
  { type: "string", field: "station_ar_format", label: "Station Format" },
  {
    type: "string",
    field: "station_ar_genre",
    label: "Station Genre",
    default: true,
  },
  {
    type: "string",
    field: "station_ar_languagecode",
    label: "Station Language Code",
  },
  { type: "string", field: "station_rg_id", label: "Station ID" },
  { type: "string", field: "station_rg_name", label: "Station Name" },
  { type: "string", field: "event_ma_id", label: "Event ID" },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "event_ma_metadatareliability",
    label: "Event Metadata Reliability",
    range: [0, 1],
    default: true,
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "artist_sp_followers",
    label: "Artist Followers",
    range: [0, 115237465],
  },
  {
    type: "string",
    field: "artist_sp_genre",
    label: "Artist Genre (Spotify)",
  },
  { type: "string", field: "artist_sp_id", label: "Artist ID" },
  {
    type: "string",
    field: "artist_sp_name",
    label: "Artist Name",
    default: true,
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "artist_sp_popularity",
    label: "Artist Popularity",
    range: [0, 100],
  },
  { type: "string", field: "artist_wd_country", label: "Artist Country" },
  {
    type: "string",
    field: "artist_wd_ethnicities",
    label: "Artist Ethnicities",
  },
  { type: "string", field: "artist_wd_genders", label: "Artist Genders" },
  {
    type: "string",
    field: "artist_wd_genre",
    label: "Artist Genre (WikiData)",
  },
  {
    type: "string",
    field: "artist_wd_instruments",
    label: "Artist Instruments",
  },
  { type: "string", field: "artist_wd_members", label: "Artist Members" },
  {
    type: "string",
    field: "artist_wd_sexualorientations",
    label: "Artist Sexual Orientations",
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "artist_wd_startyear",
    label: "Artist Start Year",
    range: [1, 80085],
  },
  { type: "string", field: "artist_wd_type", label: "Artist Type" },
  {
    type: "string",
    field: "artist_wd_voicetypes",
    label: "Artist Voice Types",
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_acousticness",
    label: "Track Acousticness",
    range: [0, 0.996],
  },
  {
    type: "string",
    field: "track_sp_beatsperbar",
    label: "Track Beats Per Bar",
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_danceability",
    label: "Track Danceability",
    range: [0, 0.996],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_duration",
    label: "Track Duration",
    range: [null, null],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_energy",
    label: "Track Energy",
    range: [0, 1],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_instrumentalness",
    label: "Track Instrumentalness",
    range: [0, 1],
  },
  { type: "string", field: "track_sp_key", label: "Track Key" },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_liveness",
    label: "Track Liveness",
    range: [0, 1],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_loudness",
    label: "Track Loudness",
    range: [-60, 2004],
  },
  { type: "string", field: "track_sp_mode", label: "Track Mode" },
  {
    type: "string",
    field: "track_sp_name",
    label: "Track Name",
    default: true,
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_popularity",
    label: "Track Popularity",
    range: [0, 100],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_speechiness",
    label: "Track Speechiness",
    range: [0, 4],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_tempo",
    label: "Track Tempo",
    range: [0, 249.923],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_valence",
    label: "Track Valence",
    range: [0, 1],
  },
  {
    type: "string OR conditional (greater, lesser, between)",
    field: "track_sp_year",
    label: "Track Year",
    range: [129.883, 2024],
  },
  { type: "string", field: "track_wd_composers", label: "Track Composers" },
  {
    type: "string",
    field: "track_wd_instrumentation",
    label: "Track Instrumentation",
  },
  { type: "string", field: "track_wd_language", label: "Track Language" },
  { type: "string", field: "track_wd_lyricists", label: "Track Lyricists" },
  { type: "string", field: "track_wd_tonality", label: "Track Tonality" },
];

export const rangeFilterMap = rangeFilters.reduce((acc, filter) => {
  acc[filter.field] = filter; // Create a map of filters by field
  return acc; // Return the accumulator
}, {});

export async function GET() {
  return NextResponse.json(rangeFilters);
}

// // app/api/search/route.js
// import { NextResponse } from "next/server";
// import { Client } from "@elastic/elasticsearch";

// const esClient = new Client({ node: process.env.ELASTICSEARCH_URL });

// export async function POST(request) {
//   const { filters, query } = await request.json();

//   try {
//     const must = [];

//     // Add text search if query exists
//     if (query) {
//       must.push({
//         multi_match: {
//           query,
//           fields: [
//             "track_sp_name^2",
//             "artist_sp_name^2",
//             "track_wd_language",
//             "artist_sp_genre",
//           ],
//         },
//       });
//     }

//     // Add filters
//     Object.entries(filters).forEach(([field, value]) => {
//       if (Array.isArray(value)) {
//         // Range filter
//         must.push({
//           range: {
//             [field]: {
//               gte: value[0],
//               lte: value[1],
//             },
//           },
//         });
//       } else if (value) {
//         // Term filter
//         must.push({
//           match: {
//             [field]: value,
//           },
//         });
//       }
//     });

//     const response = await esClient.search({
//       index: "tracks",
//       body: {
//         query: {
//           bool: { must },
//         },
//         size: 50,
//         sort: [{ _score: "desc" }, { track_sp_popularity: "desc" }],
//       },
//     });

//     return NextResponse.json({
//       hits: response.hits.hits.map((hit) => ({
//         id: hit._id,
//         ...hit._source,
//       })),
//       total: response.hits.total.value,
//     });
//   } catch (error) {
//     console.error("Error searching:", error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }
