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

const useStore = create((set) => {
  const setLoading = (key, isLoading) =>
    set((state) => ({
      loading: { ...state.loading, [key]: isLoading },
    }));
  return {
    locs: [],
    locationData: [],
    countries: [],
    fields: { value: { stationData: [], locationData: [] } },
    event_export_list: { value: {} },
    vizdata: {},
    vizMap: [],
    events: [],
    detail: null,
    loading: {},
    error: false,
    isInit: false,
    query: {},
    getLoading: (path) => (state) => state.loading?.[path] || false,
    setLoading,
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
    requestVizdata: async (ids, filters, query) => {
      setLoading("vizdata", true);
      try {
        const { data } = await axios.post(`${APIUrl}/meta/viz`, {
          ids,
          filters,
          query,
        });
        set({ vizdata: data?.data ?? {} });
        setLoading("vizdata", false);
      } catch (error) {
        //   set({ loading: false, error, hasError: true });
        setLoading("vizdata", false);
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
