import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const metricList = [
  { key: "track_sp_danceability", label: "Danceability", radar: true },
  { key: "track_sp_speechiness", label: "Speechiness", radar: true },
  { key: "track_sp_acousticness", label: "Acousticness", radar: true },
  { key: "track_sp_instrumentalness", label: "Instrumentalness", radar: true },
  { key: "track_sp_liveness", label: "Liveness", radar: true },
  { key: "track_sp_energy", label: "Energy" },
  { key: "track_sp_valence", label: "Valence" },
  { key: "track_sp_year", label: "Track Year Released" },
  { key: "track_sp_popularity", label: "Track Popularity" },
  { key: "track_sp_tempo", label: "Tempo" },
];

export const metricRadarList = metricList.filter((d) => d.radar);

export const rankMetricList = [
  { key: "artist_sp_genre", label: "Artist Genres", isArray: true },
  { key: "artist_wd_country", label: "Artist Country" },
  { key: "track_sp_key", label: "Track Key", isArray: true },
];

export default async function checkAPIKey(req) {
  const apiKey = req.headers.get("api-key"); // Read API key from headers

  const validKey = process.env.DATA_API_KEY; // Store API key securely in .env
  return apiKey === validKey;
}


export function diffObjects(obj1, obj2) {
  const diffs = {};

  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

  allKeys.forEach((key) => {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (val1 !== val2) {
      diffs[key] = { before: val1, after: val2 };
    }
  });

  return diffs;
}
