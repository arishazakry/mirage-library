import useStore from "@/store/strore";
import EventDetail from "../EventDetail";
import { useCallback, useMemo } from "react";
import { metricRadarList } from "@/lib/utils";
import { mean as d3mean } from "d3";

const EventDetailWrapper = ({ event }) => {
  const {
    detail,
    requestDetail,
    locs,
    vizdata,
    loading: { events: loadingDetail },
  } = useStore();
  const onSelect = useCallback(
    (data) => {
      requestDetail(data);
    },
    [requestDetail]
  );
  const meanRadar = useMemo(() => {
    const total = vizdata;
    const meanradar = {};
    metricRadarList.forEach(({ key }) => {
      meanradar[key] = d3mean(total, (d) => d[key]);
    });
    return meanradar;
  }, [vizdata]);
  console.log(detail);
  return (
    <EventDetail
      currentDetail={detail}
      onSelect={onSelect}
      locs={locs}
      sx={{ height: "100%", position: "relative" }}
      meanradar={meanRadar}
      // onTogleWin={()=>onTogleWin("eventDetail")}
    />
  );
};

export default EventDetailWrapper;
