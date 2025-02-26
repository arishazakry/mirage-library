import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const metricList = [
  { key: "Track_SP_Danceability", label: "Danceability", radar: true },
  { key: "Track_SP_Speechiness", label: "Speechiness", radar: true },
  { key: "Track_SP_Acousticness", label: "Acousticness", radar: true },
  { key: "Track_SP_Instrumentalness", label: "Instrumentalness", radar: true },
  { key: "Track_SP_Liveness", label: "Liveness", radar: true },
  { key: "Track_SP_Energy", label: "Energy" },
  { key: "Track_SP_Valence", label: "Valence" },
  { key: "Track_SP_Year", label: "Track Year Released" },
  { key: "Track_SP_Popularity", label: "Track Popularity" },
  { key: "Track_SP_Tempo", label: "Tempo" },
];

export const metricRadarList = metricList.filter((d) => d.radar);

export const rankMetricList = [
  { key: "Artist_SP_Genre", label: "Artist Genres", isArray: true },
  { key: "Artist_WD_Country", label: "Artist Country" },
  { key: "Track_SP_Key", label: "Track Key", isArray: true },
];
