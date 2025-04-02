import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v5 as uuidv5 } from "uuid";

const NAMESPACE = "123e4567-e89b-12d3-a456-426614174000";

export function generateChartId(obj) {
  return uuidv5(JSON.stringify(obj), NAMESPACE);
}

export const useChartStore = create(
  persist(
    (set, get) => ({
      charts: [],
      chartIds: new Set(), // Used for fast lookups (not persisted directly)
      comparisonCharts: [],
      groups: {}, // Store groups { groupName: [chartId1, chartId2] }

      // ✅ Add Chart (Prevent Duplicates)
      addChart: (chartData) =>
        set((state) => {
          const id = chartData.id ?? generateChartId(chartData);
          if (state.chartIds.has(id)) return state;

          const newChart = {
            ...chartData,
            id,
            createdAt: new Date().toISOString(),
          };

          return {
            charts: [...state.charts, newChart],
            chartIds: new Set([...state.chartIds, id]), // Update Set
          };
        }),

      // ✅ Remove Chart
      removeChart: (chartId) =>
        set((state) => {
          const updatedCharts = state.charts.filter(
            (chart) => chart.id !== chartId
          );
          const updatedGroups = Object.fromEntries(
            Object.entries(state.groups).map(([group, chartIds]) => [
              group,
              chartIds.filter((id) => id !== chartId),
            ])
          );

          return {
            charts: updatedCharts,
            chartIds: new Set(updatedCharts.map((chart) => chart.id)),
            comparisonCharts: state.comparisonCharts.filter(
              (chart) => chart.id !== chartId
            ),
            groups: updatedGroups,
          };
        }),

      // ✅ Rename Chart
      renameChart: (chartId, newName) =>
        set((state) => ({
          charts: state.charts.map((chart) =>
            chart.id === chartId ? { ...chart, title: newName } : chart
          ),
        })),

      // ✅ Add to Comparison (Limit 2)
      addToComparison: (chart) =>
        set((state) => {
          if (state.comparisonCharts.some((c) => c.id === chart.id))
            return state;
          return {
            comparisonCharts:
              state.comparisonCharts.length < 2
                ? [...state.comparisonCharts, chart]
                : [state.comparisonCharts[1], chart],
          };
        }),

      clearComparison: () => set({ comparisonCharts: [] }),

      // ✅ Group Charts
      createGroup: (groupName) =>
        set((state) => ({
          groups: { ...state.groups, [groupName]: [] },
        })),
      renameGroup: (oldName, newgroupName) =>
        set((state) => {
          const value = state.groups[oldName];
          if (value) {
            const { [oldName]: _, ...remainingGroups } = state.groups;
            return { groups: { [newgroupName]: value, ...remainingGroups } };
          }
          return {};
        }),
      addChartToGroup: (groupName, chartId) =>
        set((state) => {
          if (!state.groups[groupName]) return state; // Group must exist
          if (state.groups[groupName].includes(chartId)) return state; // No duplicates

          return {
            groups: {
              ...state.groups,
              [groupName]: [...state.groups[groupName], chartId],
            },
          };
        }),

      removeChartFromGroup: (groupName, chartId) =>
        set((state) => ({
          groups: {
            ...state.groups,
            [groupName]: state.groups[groupName].filter((id) => id !== chartId),
          },
        })),

      deleteGroup: (groupName) =>
        set((state) => {
          const { [groupName]: _, ...remainingGroups } = state.groups;
          return { groups: remainingGroups };
        }),
    }),
    {
      name: "chart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        charts: state.charts,
        chartIds: [...state.chartIds], // Convert Set to Array
        comparisonCharts: state.comparisonCharts,
        groups: state.groups,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.chartIds = new Set(state.chartIds); // Convert back to Set after rehydration
        }
      },
    }
  )
);

// ✅ Sync Zustand store across tabs/windows
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "chart-storage") {
      useChartStore.persist.rehydrate();
    }
  });
}
