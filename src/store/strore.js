import { create } from "zustand";
import {
  sum as d3sum,
  mean as d3mean,
  groups as d3groups,
  csv as d3csv,
} from "d3";
import axios from "axios";
import lzString from "lz-string";
import { getDownloadData } from "./ulti";
// import exportVariable from "./data/MIRAGE_exportvariables.csv";
// import locationData from "./data/location.json";

export const APIUrl =
  (process.env.NODE_ENV === "production"
    ? process.env.DATA_API
    : process.env.DATA_API_LOCAL) ?? "api";
export const HOMEURL =
  (process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_DATA_HOMEPAGE
    : process.env.REACT_APP_DATA_HOMEPAGE_LOCAL) ?? "";

axios.defaults.headers.common = {
  "api-key": process.env.DATA_API_KEY,
};

const useStore = create((set, get) => {
  const setLoading = (key, isLoading) =>
    set((state) => ({
      loading: { ...state.loading, [key]: isLoading },
    }));
  return {
    locs: [],
    locationData: [],
    countries: [],
    histMetrics: ["track_sp_year"],
    scatterMetrics: ["track_sp_energy", "track_sp_liveness"],
    fields: { value: { stationData: [], locationData: [] } },
    event_export_list: { value: {} },
    vizdata: {},
    currentControllerVizdata: null,
    vizMap: [],
    avg: [],
    events: [],
    detail: null,
    loading: {},
    error: false,
    isInit: false,
    query: {},
    getLoading: (path) => (state) => state.loading?.[path] || false,
    setLoading,
    sethistMetrics: (metrics) => {
      set({ histMetrics: metrics });
    },
    setscatterMetrics: (metrics) => {
      set({ scatterMetrics: metrics });
    },
    setError: (path, error) =>
      set((state) => ({
        [path]: { ...state[path], isLoading: false, error, hasError: true },
      })),
    requestMapViz: async (filters, query) => {
      setLoading("vizMap", true);
      try {
        const { data } = await axios.post(`${APIUrl}/meta/viz/map/`, {
          filters,
          query,
        });
        set({ vizMap: data?.data ?? [] });
        setLoading("vizMap", false);
      } catch (error) {
        console.log(error);
        //   set({ loading: false, error, hasError: true });
        setLoading("vizMap", false);
      }
    },
    fetchData: async () => {
      setLoading("fields", true);

      try {
        const [
          { data: cityData },
          { data: stationFields },
          { data: locationFields },
          { data: locationData },
        ] = await Promise.all([
          axios.get(`${APIUrl}/station/city`),
          axios.get(`${APIUrl}/station/fields/`),
          axios.get(`${APIUrl}/location/fields/`),
          axios.get(`${APIUrl}/location`),
        ]);
        const byLocName = {};
        locationData.forEach((d) => {
          d.long = +d.location_rg_longitude;
          d.lat = +d.location_rg_latitude;
          delete d.location_rg_longitude;
          delete d.location_rg_latitude;
          byLocName[d["location_rg_id"]] = d;
        });

        const locs = cityData.map((d) => {
          const locinfo = byLocName[d.location_id] ?? {};
          return {
            ...locinfo,
            title: `${locinfo.location_rg_city} - ${locinfo.location_rg_country}`,
            count: +d.count,
          };
        });

        const countries = d3groups(locs, (d) => d["location_rg_country"]).map(
          (d) => {
            return {
              title: d[0],
              long: d3mean(d[1], (e) => e.long),
              lat: d3mean(d[1], (e) => e.lat),
              count: d3sum(d[1], (e) => e.count),
            };
          }
        );

        countries.sort((a, b) => b.count - a.count);
        locs.sort((a, b) => b.count - a.count);

        set({
          locs,
          countries,
          locationData,
          fields: { value: { ...stationFields, ...locationFields } },
        });
        setLoading("fields", false);
        // load export list
        // const event_export_list = {};
        // const exportData = await d3csv("./data/MIRAGE_exportvariables.csv");
        // exportData.forEach((d) => {
        //   if (d["export?"] === "Y") event_export_list[d["new_fields"]] = true;
        // });

        // set({ event_export_list });
      } catch (error) {
        //   set({ loading: false, error, hasError: true });
        setLoading("fields", false);
      }
    },
    requestAvgData: async (ids, filters, query) => {
      setLoading("avg", true);
      try {
        const { data } = await axios.post(`${APIUrl}/meta/viz/average`, {
          ids,
          filters,
          query,
        });
        set({ vizdata: data?.avg ?? [] });
        setLoading("avg", false);
      } catch (error) {
        //   set({ loading: false, error, hasError: true });
        setLoading("avg", false);
      }
    },
    requestVizdata: async (ids, filters, query) => {
      // Cancel any previous request
      const prev = get().currentControllerVizdata;
      const metrics = get().histMetrics;
      const scatterMetrics = get().scatterMetrics;
      if (prev) prev.abort();

      const controller = new AbortController();
      set({ currentControllerVizdata: controller });

      setLoading("vizdata", true);
      set({ vizdata: { his: {}, rank: {}, executionTime: null } });

      try {
        const response = await fetch(`${APIUrl}/meta/viz`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids,
            filters,
            query,
            metrics,
            scatterMetrics,
          }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body from stream");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const histograms = {};
        const scatters = {};
        const radar = {};
        const network = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop(); // Save the partial for next loop

          for (const part of parts) {
            const lines = part.trim().split("\n");
            const event = lines
              .find((l) => l.startsWith("event:"))
              ?.slice(7)
              .trim();
            const dataLine = lines
              .find((l) => l.startsWith("data:"))
              ?.slice(6)
              .trim();

            if (!event || !dataLine) continue;

            const data = JSON.parse(dataLine);

            if (event === "histogram") {
              histograms[data.metric] = data.data;
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  his: { ...histograms },
                },
              }));
            } else if (event === "rankings") {
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  rank: data,
                },
              }));
            } else if (event === "scatter") {
              scatters[data.metric] = data;
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  scatter: { ...scatters },
                },
              }));
            } else if (event === "radar") {
              radar[data.metric] = data;
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  radar: { ...radar },
                },
              }));
            } else if (event === "network_artist") {
              network[data.metric] = data;
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  network: { ...network },
                },
              }));
            } else if (event === "done") {
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  executionTime: data.executionTime,
                },
              }));
            } else if (event === "error") {
              console.error("Stream error:", data.error);
              set({ error: data.error });
            }
          }
        }

        setLoading("vizdata", false);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("VizData stream error:", error);
          set({ error: error.message });
        }
        setLoading("vizdata", false);
      }
    },
    updateVizHistograms: async (ids, filters, query, metrics) => {
      const { vizdata } = get();
      // Determine which metrics are already available
      const existingMetrics = new Set(Object.keys(vizdata.his || {}));
      const missingMetrics = metrics.filter((m) => !existingMetrics.has(m));
      if (missingMetrics.length === 0) return; // All metrics already available

      // Cancel any previous histogram update stream
      const prev = get().currentControllerVizdata;
      if (prev) prev.abort();

      const controller = new AbortController();
      set({ currentControllerVizdata: controller });

      try {
        const response = await fetch(`${APIUrl}/meta/viz/hist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids,
            filters,
            query,
            metrics: missingMetrics,
          }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body from stream");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const newHistograms = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop(); // Save the partial for next loop

          for (const part of parts) {
            const lines = part.trim().split("\n");
            const event = lines
              .find((l) => l.startsWith("event:"))
              ?.slice(7)
              .trim();
            const dataLine = lines
              .find((l) => l.startsWith("data:"))
              ?.slice(6)
              .trim();

            if (!event || !dataLine) continue;

            const data = JSON.parse(dataLine);

            if (event === "histogram") {
              newHistograms[data.metric] = data.data;
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  his: {
                    ...prev.vizdata.his,
                    [data.metric]: data.data,
                  },
                },
              }));
            } else if (event === "error") {
              console.error("Stream error:", data.error);
              set({ error: data.error });
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Histogram stream error:", error);
          set({ error: error.message });
        }
      }
    },
    updateVizScatter: async (ids, filters, query, metrics) => {
      const { vizdata } = get();
      // Determine which metrics are already available
      const existingMetrics = new Set(Object.keys(vizdata.scatter || {}));
      const missingMetrics = !existingMetrics.has(metrics.join(","))
        ? metrics
        : [];
      if (missingMetrics.length === 0) return; // All metrics already available

      // Cancel any previous histogram update stream
      const prev = get().currentControllerVizdata;
      if (prev) prev.abort();

      const controller = new AbortController();
      set({ currentControllerVizdata: controller });

      try {
        if (metrics.length !== 2) return;
        const response = await fetch(`${APIUrl}/meta/viz/scatter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids,
            filters,
            query,
            metrics: missingMetrics,
          }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body from stream");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const newHistograms = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop(); // Save the partial for next loop

          for (const part of parts) {
            const lines = part.trim().split("\n");
            const event = lines
              .find((l) => l.startsWith("event:"))
              ?.slice(7)
              .trim();
            const dataLine = lines
              .find((l) => l.startsWith("data:"))
              ?.slice(6)
              .trim();

            if (!event || !dataLine) continue;

            const data = JSON.parse(dataLine);

            if (event === "scatter") {
              newHistograms[data.metric] = data;
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  scatter: {
                    ...prev.vizdata.scatter,
                    [data.metric]: data,
                  },
                },
              }));
            } else if (event === "error") {
              console.error("Stream error:", data.error);
              set({ error: data.error });
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Histogram stream error:", error);
          set({ error: error.message });
        }
      }
    },
    updateVizRadar: async (ids, filters, query, metrics) => {
      const { vizdata } = get();
      // Determine which metrics are already available
      const existingMetrics = new Set(Object.keys(vizdata.radar || {}));
      const missingMetrics = !existingMetrics.has(metrics.join(","))
        ? metrics
        : [];
      if (missingMetrics.length === 0) return; // All metrics already available

      // Cancel any previous histogram update stream
      const prev = get().currentControllerVizdata;
      if (prev) prev.abort();

      const controller = new AbortController();
      set({ currentControllerVizdata: controller });

      try {
        if (metrics.length !== 2) return;
        const response = await fetch(`${APIUrl}/meta/viz/radar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids,
            filters,
            query,
            metrics: missingMetrics,
          }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body from stream");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const newHistograms = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop(); // Save the partial for next loop

          for (const part of parts) {
            const lines = part.trim().split("\n");
            const event = lines
              .find((l) => l.startsWith("event:"))
              ?.slice(7)
              .trim();
            const dataLine = lines
              .find((l) => l.startsWith("data:"))
              ?.slice(6)
              .trim();

            if (!event || !dataLine) continue;

            const data = JSON.parse(dataLine);

            if (event === "radar") {
              newHistograms[data.metric] = data;
              set((prev) => ({
                vizdata: {
                  ...prev.vizdata,
                  radar: {
                    ...prev.vizdata.radar,
                    [data.metric]: data,
                  },
                },
              }));
            } else if (event === "error") {
              console.error("Stream error:", data.error);
              set({ error: data.error });
            }
          }
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Radar stream error:", error);
          set({ error: error.message });
        }
      }
    },
    requestEvents: async (filters, query, size, isid) => {
      setLoading("events", true);
      try {
        const { data } = await axios.post(`${APIUrl}/search/`, {
          filters,
          query,
          size,
        });
        set({ events: data?.data ?? [] });
        setLoading("events", false);
      } catch (error) {
        //   set({ loading: false, error, hasError: true });
        setLoading("events", false);
      }
    },
    requestDetail: async (data) => {
      setLoading("detail", true);
      axios
        .get(`${APIUrl}/meta/${data.event_ma_id}`)
        .then(({ data: _data }) => {
          const data = _data?.data;
          // flat data
          if (data) {
            // data.lat = data.location_rg_longitude;
            // data.long = data.location_rg_latitude;
            data.long = data.location_rg_longitude;
            data.lat = data.location_rg_latitude;
            delete data.location_rg_longitude;
            delete data.location_rg_latitude;
            set({ detail: data ?? null });
            setLoading("detail", false);
          } else {
            setLoading("detail", false);
          }
        })
        .catch((error) => {
          setLoading("detail", false);
        });
    },
    getDetail: (id) => {
      // Fetch and process detail
    },
    getShortenLink: (filters, eventSelectedData, getDetail) => {
      const _data = {
        filters,
        ids: eventSelectedData.map((d) => d._id),
        id: getDetail(),
      };
      const compressed = lzString.compressToEncodedURIComponent(
        JSON.stringify(_data)
      );
      return axios
        .post(`${APIUrl}/url/`, { data: compressed })
        .then(({ data }) => HOMEURL + "?selected=" + data._id);
    },
    handleExportRows: (rows, filters) => {
      setLoading("exportdata", true);
      getDownloadData(rows, filters)
        .then((datadownload) => {
          const csvOptions = {
            fieldSeparator: "|",
            quoteStrings: '"',
            decimalSeparator: ".",
            showLabels: true,
            filename: `mirage-mc-${new Date().toDateString()}`,
            useBom: true,
            useKeysAsHeaders: true,
            headers: Object.keys(event_export_list),
          };
          const csvExporter = generateCsv(csvOptions);
          csvExporter.generateCsv(datadownload);
          setLoading("exportdata", false);
        })
        .catch((e) => {
          setLoading("exportdata", false);
        });
    },
    setQuery: (newData) => set({ query: newData }),
  };
});

export default useStore;
