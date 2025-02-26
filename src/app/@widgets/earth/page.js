"use client";
import React from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import Earth3D from "@/components/Earth3D";

export default function EarthView() {
  return (
    <AutoSizer style={{ height: "100%", width: "100%" }}>
      {({ height, width }) => {
        return (
          <Earth3D
            // locs={getList("locs")}
            // countries={getList("countries")}
            locs={[]}
            countries={[]}
            // onSelect={onSelect}
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
