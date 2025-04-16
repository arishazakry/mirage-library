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
    histMetrics,
    sethistMetrics,
    requestDetail,
    requestVizdata,
    // requestAvgData,
    updateVizHistograms,
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
    // requestAvgData(ids, filters, query);
    requestVizdata(ids, filters, query);
  }, [vizsource, eventSelectedData, query, filters]);
  const onSelectStream = useCallback((data) => {
    requestDetail(data);
  }, []);
  const handleChangeMetricHistogram = useCallback(
    (keys) => {
      const ids = vizsource ? undefined : eventSelectedData.map((d) => d._id);
      updateVizHistograms(ids, filters, query, keys);
    },
    [vizsource, eventSelectedData, query, filters, updateVizHistograms]
  );
  return (
    <VizPanel
      ountries={countries}
      data={vizdata}
      source={vizsource}
      onChangeSource={(source) => {
        setVizSource(source);
      }}
      histMetrics={histMetrics}
      onChangehistMetrics={(keys) => {
        sethistMetrics(keys);
        handleChangeMetricHistogram(keys);
      }}
      onSelect={onSelectStream}
    />
  );
}
