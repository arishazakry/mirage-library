"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import useStore from "@/store/strore"; // Zustand store
import VizPanel from "@/components/VizPanel";
import { useSelector } from "react-redux";
import { selectFilters } from "@/store/reducer/streamfilters";

export default function VizPanelWraper() {
  const {
    countries,
    vizdata,
    requestDetail,
    requestVizdata,
    query,
    loading: { events: loadingEvents },
  } = useStore();
  const filters = useSelector(selectFilters);
  const [vizsource, setVizSource] = useState("event");
  // const eventTotalData = useSelector((state) => state.seletedList.currentList);
  const _eventSelectedData = useSelector((state) => state.seletedList.items);
  const eventSelectedData = useMemo(
    () => Array.from(_eventSelectedData.values()),
    [_eventSelectedData]
  );
  useEffect(() => {
    const ids = vizsource ? undefined : eventSelectedData.map((d) => d._id);
    requestVizdata(ids, filters, query);
  }, [vizsource, eventSelectedData, query, filters]);
  const onSelectStream = useCallback((data) => {
    requestDetail(data);
  }, []);
  return (
    <VizPanel
      ountries={countries}
      data={vizdata}
      source={vizsource}
      onChangeSource={(source) => {
        setVizSource(source);
      }}
      onSelect={onSelectStream}
    />
  );
}
