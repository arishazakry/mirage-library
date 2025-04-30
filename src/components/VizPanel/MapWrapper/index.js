import Map from "@/components/Map";
import PlotlHolder from "@/components/PlotlHolder";
import { selectFilters } from "@/store/reducer/streamfilters";
import useStore from "@/store/strore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import AutoSizer from "react-virtualized-auto-sizer";

export default function MapWrapper({}) {
  const {
    detail: currentDetail,
    locs,
    requestMapViz,
    vizMap: events,
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
  const [eventlocs, setEventlocs] = useState([]);
  useEffect(() => {
    try {
      const _locsMap = {};
      locs.forEach((d) => (_locsMap[d["location_rg_id"]] = d));
      const _locs = events.map(({ event_count, location_rg_id }) => ({
        title: _locsMap[location_rg_id]?.title,
        location_rg_id,
        count: +event_count,
        lat: _locsMap[location_rg_id]?.lat,
        long: _locsMap[location_rg_id]?.long,
      }));
      setEventlocs(_locs);
    } catch (e) {}
  }, [locs, events]);
  const mapData = useMemo(
    () => ({ locs: eventlocs, highlight: currentDetail }),
    [eventlocs, currentDetail]
  );
  return (
    <PlotlHolder title={"Map"} type="map" chartData={mapData}>
      <div className="w-full aspect-square">
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
      </div>
    </PlotlHolder>
  );
}
