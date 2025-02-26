import Map from "../Map";
import AutoSizer from "react-virtualized-auto-sizer";
import { useState, useEffect } from "react";
import { groups } from "d3";

export default function EventMap({ currentDetail, locs, events }) {
  const [eventlocs, setEventlocs] = useState([]);
  useEffect(() => {
    try {
      const _locsMap = {};
      locs.forEach((d) => (_locsMap[d["location_rg_id"]] = d));
      const _locs = groups(events, (d) => d["location_rg_id"]).map(
        ([c, cou]) => ({
          title: _locsMap[c]?.title,
          location_rg_id: c,
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
