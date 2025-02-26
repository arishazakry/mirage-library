import { create } from "zustand";
import {
  sum as d3sum,
  mean as d3mean,
  groups as d3groups,
  csv as d3csv,
} from "d3";
import axios from "axios";
import lzString from "lz-string";
// import exportVariable from "./data/MIRAGE_exportvariables.csv";
import locationData from "./data/location.json";

const APIKey = process.env.DATA_API_KEY;
export const APIUrl =
  (process.env.NODE_ENV === "production"
    ? process.env.DATA_API
    : process.env.DATA_API_LOCAL) ?? "api";
export const HOMEURL =
  (process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_DATA_HOMEPAGE
    : process.env.REACT_APP_DATA_HOMEPAGE_LOCAL) ?? "";

axios.defaults.headers.common = {
  "api-key": APIKey,
};

const useStore = create((set) => {
  const setLoading = (key, isLoading) =>
    set((state) => ({
      loading: { ...state.loading, [key]: isLoading },
    }));
  return {
    locs: [],
    countries: [],
    fields: { value: { stationData: [], locationData: [] } },
    event_export_list: { value: {} },
    vizdata: [],
    events: [],
    detail: null,
    loading: {},
    error: false,
    isInit: false,
    getLoading: (path) => (state) => state.loading?.[path] || false,
    setLoading,
    setError: (path, error) =>
      set((state) => ({
        [path]: { ...state[path], isLoading: false, error, hasError: true },
      })),
    fetchData: async () => {
      setLoading("fields", true);

      try {
        const [cityData, stationFields, locationFields] = await Promise.all([
          axios.get(`${APIUrl}/station/city`),
          axios.get(`${APIUrl}/station/fields/`),
          axios.get(`${APIUrl}/location/fields/`),
        ]);

        const byLocName = {};
        locationData.forEach((d) => {
          d.long = +d.Location_RG_Longitude;
          d.lat = +d.Location_RG_Latitude;
          delete d.Location_RG_Longitude;
          delete d.Location_RG_Latitude;
          byLocName[d["Location_RG_ID"]] = d;
        });

        const locs = cityData.data.map((d) => {
          const locinfo = byLocName[d._id] ?? {};
          return {
            ...locinfo,
            title: `${locinfo.location_rg_city} - ${locinfo.location_rg_country}`,
            count: d.count,
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
          fields: { value: { ...stationFields.data, ...locationFields.data } },
        });
        setLoading("fields", false);
        // load export list
        const event_export_list = {};
        const exportData = await d3csv("./data/MIRAGE_exportvariables.csv");
        exportData.forEach((d) => {
          if (d["export?"] === "Y") event_export_list[d["new_fields"]] = true;
        });

        set({ event_export_list });
      } catch (error) {
        //   set({ loading: false, error, hasError: true });
        setLoading("fields", false);
      }
    },
    requestVizdata: async (id) => {
      setLoading("vizdata", true);
      try {
        const { data } = await axios.post(`${APIUrl}/meta/`, { id, viz: true });
        set({ vizdata: data ?? [] });
        setLoading("vizdata", false);
      } catch (error) {
        //   set({ loading: false, error, hasError: true });
        setLoading("vizdata", false);
      }
    },
    requestEvents: async (filters, size, isid) => {
      setLoading("events", true);
      try {
        const { data } = await axios.post(`${APIUrl}/search/`, {
          filters,
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
            // data.lat = data.Location_RG_Longitude;
            // data.long = data.Location_RG_Latitude;
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
  };
});

export default useStore;
