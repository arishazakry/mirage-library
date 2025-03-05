"use client";
import React, { useCallback } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import Earth3D from "@/components/Earth3D";
import useStore from "@/store/strore";
import { dispatch } from "d3";
import { setFilters } from "@/store/reducer/streamfilters";

export default function EarthView() {
  const {
    locs,
    countries,
    loading: { events: loadingEvents },
  } = useStore();
  const onSelect = useCallback((value, extra) => {
    if (extra) setZoomLoc({ lng: extra.long, lat: extra.lat });
    // if (Object.keys(value)[0]) {
    //   logEvents("click_earth", { ...value });
    // }
    dispatch(setFilters({ value }));
  }, []);
  return (
    <AutoSizer style={{ height: "100%", width: "100%" }}>
      {({ height, width }) => {
        return (
          <Earth3D
            locs={locs}
            countries={countries}
            onSelect={onSelect}
            // onSelectLegend={setFuncCollection}
            width={width}
            height={height}
            // zoomLoc={zoomLoc}
          />
        );
      }}
    </AutoSizer>
  );
}
