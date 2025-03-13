"use client";
import React, { useCallback, useEffect, useState } from "react";
import useStore from "@/store/strore"; // Zustand store
import EventMap from "@/components/EventMap";
import { useSelector } from "react-redux";
import { selectFilters } from "@/store/reducer/streamfilters";

export default function EventMapWraper() {
  const {
    detail,
    locs,
    requestMapViz,
    vizMap,
    query,
    loading: { vizMap: loadingvizMap },
  } = useStore();
  const filters = useSelector(selectFilters);
  const fetchEvents = useCallback(
    (filter, query) => requestMapViz(filter, query),
    [requestMapViz] // Dependency ensures it's stable across renders
  );
  useEffect(() => {
    fetchEvents(filters, query);
  }, [fetchEvents, filters, query]);
  return <EventMap currentDetail={detail} events={vizMap} locs={locs} />;
}
