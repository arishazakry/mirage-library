import { create } from "zustand";
import { persist } from "zustand/middleware";

// Define the chart interface
const generateChartId = () => Date.now().toString();

export const useChartStore = create(
  persist(
    (set, get) => ({
      charts: [],
      comparisonCharts: [],

      // Add a new chart
      addChart: (chartData) =>
        set((state) => ({
          charts: [
            ...state.charts,
            {
              ...chartData,
              id: generateChartId(),
              createdAt: new Date().toLocaleString(),
            },
          ],
        })),

      // Remove a chart by ID
      removeChart: (chartId) =>
        set((state) => ({
          charts: state.charts.filter((chart) => chart.id !== chartId),
          comparisonCharts: state.comparisonCharts.filter(
            (chart) => chart.id !== chartId
          ),
        })),

      // Add chart to comparison (max 2)
      addToComparison: (chart) =>
        set((state) => {
          // If chart already in comparison, do nothing
          if (state.comparisonCharts.some((c) => c.id === chart.id)) {
            return state;
          }

          // Add to comparison, limit to 2
          const updatedComparison =
            state.comparisonCharts.length < 2
              ? [...state.comparisonCharts, chart]
              : [state.comparisonCharts[1], chart];

          return { comparisonCharts: updatedComparison };
        }),

      // Clear comparison
      clearComparison: () => set({ comparisonCharts: [] }),

      // Get all charts
      getAllCharts: () => get().charts,

      // Get comparison charts
      getComparisonCharts: () => get().comparisonCharts,
    }),
    {
      name: "chart-storage", // unique name
      getStorage: () => localStorage, // use localStorage
    }
  )
);
