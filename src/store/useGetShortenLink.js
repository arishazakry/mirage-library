"use client";
import { useCallback } from "react";
import axios from "axios";
import lzString from "lz-string";
import useStore, { APIUrl, HOMEURL } from "@/store/strore"; // Zustand store
import { useSelector } from "react-redux";
import { selectFilters } from "./reducer/streamfilters";

const useGetShortenLink = () => {
  const { getDetail } = useStore();
  const filters = useSelector(selectFilters);
  const eventSelectedData = useSelector((state) =>
    Object.values(state.seletedList.items)
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
