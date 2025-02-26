import Map from "../Map";
import AutoSizer from "react-virtualized-auto-sizer";
import { useState, useEffect } from "react";
import { groups } from "d3";

export default function ({ currentDetail, locs, events }) {
  const [eventlocs, setEventlocs] = useState([]);
  useEffect(() => {
    try {
      const _locsMap = {};
      locs.forEach((d) => (_locsMap[d["Location_RG_ID"]] = d));
      const _locs = groups(events, (d) => d["Location_RG_ID"]).map(
        ([c, cou]) => ({
          title: _locsMap[c]?.title,
          Location_RG_ID: c,
          count: cou.length,
          lat: _locsMap[c]?.lat,
          long: _locsMap[c]?.long,
        })
      );
      setEventlocs(_locs);
    } catch (e) {}
  }, [locs, events]);
  return (
    <AutoSizer style={{ height: "100%", width: "100%" }}>
      {({ height, width }) => {
        return (
          <Map
            height={height}
            width={width}
            locs={eventlocs}
            highlight={currentDetail}
          />
        );
      }}
    </AutoSizer>
  );
}
