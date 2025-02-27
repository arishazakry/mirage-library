"use client";
import { useCallback, useMemo } from "react";
import axios from "axios";
import lzString from "lz-string";
import useStore, { APIUrl, HOMEURL } from "@/store/strore"; // Zustand store
import { useSelector } from "react-redux";
import { selectFilters } from "./reducer/streamfilters";

const useGetShortenLink = () => {
  const { getDetail } = useStore();
  const filters = useSelector(selectFilters);
  const _eventSelectedData = useSelector((state) => state.seletedList.items);
  const eventSelectedData = useMemo(
    () => Array.from(_eventSelectedData.values()),
    [_eventSelectedData]
  );

  const getShortenLink = useCallback(async () => {
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
      .then(({ data }) => {
        return `${HOMEURL}?selected=${data._id}`;
      })
      .catch((error) => {
        console.error("Error generating shortened link:", error);
        return null;
      });
  }, [filters, eventSelectedData, getDetail]);

  return getShortenLink;
};

export default useGetShortenLink;
