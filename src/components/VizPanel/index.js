"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
// import Histogram from "./Histogram";
// import Scatterwrapper from "./Scatterwrapper";
// import PCAplot from "./PCAplot";
import { scaleOrdinal, maxIndex, rollup, color } from "d3";
import { isArray } from "lodash";
import Barchart from "./Barchart";
import { metricList, metricRadarList, rankMetricList } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { colorArr } from "../Earth3D";
import { Card } from "../ui/card";
import { useTheme } from "next-themes";
import HistogramDis from "./HistogramDis";
import PlotlHolder from "../PlotlHolder";
import { Checkbox } from "../ui/checkbox";
import {
  InputMultiSelect,
  InputMultiSelectTrigger,
} from "../ui/InputMultiSelectTrigger";
import { Separator } from "../ui/separator";
import Scatterplot from "./Scatterplot";
import ScatterplotExt from "./ScatterplotExt";
import Heatmap from "./Heatmap";
import Contour from "./Contour";
import TwoDPlot from "./TwoDPlot";
import EventMap from "../EventMap";
import MapWrapper from "./MapWrapper";
import RadarChart from "../RadarChart";
import AutoSizer from "react-virtualized-auto-sizer";
// import GraphClient from "./Network";
import dynamic from "next/dynamic";
import ParallelCoordinatesPlot from "../ParallelCoordinatesPlot";

const TOP = 10;
const NetworkVisualizationContainer = dynamic(() => import("@/components/VizPanel/Network/NetworkVisualizationContainer"), {
  ssr: false,
});


function VizPanel({
  data,
  source,
  histMetrics,
  onChangehistMetrics,
  scatterMetrics,
  onChangescatterMetrics,
  onChangeNetwork,
  onChangeSource,
  onSelect,
}) {
  const [histindata, sethisindata] = useState([]);
  const [rankdata, setrankdata] = useState([]);
  const [scatterdata, setscatterdata] = useState([]);
  const [radardata, setradardata] = useState({});
  const [network, setNetwork] = useState({});
  const [colorKey, setColorKey] = useState(rankMetricList[0].key);
  const [hovered, sethovered] = useState(null);
  const { resolvedTheme } = useTheme();
  const [theme, setTheme] = useState({
    primaryColor: "#1D4ED8", // Default primary
    textColor: "#000000", // Default text
    cardBg: "#FFFFFF", // Default card background
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      const rootStyles = getComputedStyle(document.documentElement);
      setTheme({
        primaryColor:
          `$hsl(${rootStyles.getPropertyValue("--primary").trim()})` ||
          "#1D4ED8",
        textColor:
          rootStyles.getPropertyValue("--text-primary").trim() || "#000000",
        cardBg:
          rootStyles.getPropertyValue("--background-card").trim() || "#FFFFFF",
        fontFamily:
          rootStyles.getPropertyValue("--font-family").trim() ||
          "Inter, sans-serif",
        fontSize: rootStyles.getPropertyValue("--font-size").trim() || "14px",
      });
    }
  }, [resolvedTheme]);
  useEffect(() => {
    const histindata = metricList
      .filter(({ key }) => histMetrics.includes(key))
      .map(({ key, label }) => ({
        key,
        label,
        data: data?.his?.[key] ?? {},
      }));
    sethisindata(histindata);
  }, [data?.his, histMetrics]);

  useEffect(() => {
    const scatter = data?.scatter?.[scatterMetrics];
    if (scatter) {
      setscatterdata([
        {
          key: scatter.metric.join(","),
          label: scatter.metric.join(","),
          data: scatter,
        },
      ]);
    }
  }, [data?.scatter, scatterMetrics]);
  useEffect(() => {
    const radard = data?.radar;
    if (radard && Object.keys(radard).length) {
      const radar = Object.values(radard)[0]?.data?.[0] ?? {};
      const metric = metricRadarList;
      const lowerBound = [],
        upperBound = [],
        mean = {};
      metric.forEach((d) => {
        lowerBound.push(+radar[`${d.key}_min`] ?? undefined);
        upperBound.push(+radar[`${d.key}_max`] ?? undefined);
        mean[d.key] = radar[`${d.key}_median`];
      });
      setradardata({
        key: Object.values(radard)[0]?.metric.join(","),
        label: "Radar chart",
        data: { metricInfo: metric, mean, band: { lowerBound, upperBound } },
      });
    }
  }, [data?.radar]);
  useEffect(() => {
    const network = data?.network;
    // if (network && Object.keys(network).length) {
    if (network) {
      const network_data = network.data ?? {};
      setNetwork({
        key: "artist,genere",
        label: "Artist Network by Genere",
        data: network_data,
        parameters:network.parameters??{}
      });
    }
  }, [data?.network]);
  const onHover = useCallback((data) => {
    sethovered(data);
  }, []);

  const [rankMap, setrankMap] = useState({
    data: {},
    colorsCategory: () => {},
    getColor: () => {},
  });

  useEffect(() => {
    setrankdata(data?.rank?.[colorKey] ?? []);
  }, [colorKey, data]);
  useEffect(() => {
    const colorsCategory = (function (otherColor = "#ececec") {
      const scale = scaleOrdinal(colorArr);
      let master = (val) => {
        if (!val || val === "" || val.trim === "") return "#444444";
        const domain = scale.domain();
        if (domain.find((d) => d === val) || domain.length < TOP)
          return scale(val);
        else return otherColor;
      };
      master.domain = scale.domain;
      master.range = scale.range;
      return master;
    })();
    rankdata.forEach((d) => (d.color = colorsCategory(d.title)));
    const r = {};
    rankdata.forEach((element) => {
      r[element["title"]] = element;
    });
    setrankMap({
      data: r,
      colorsCategory,
      getColor: function (d) {
        if (isArray(d[colorKey])) {
          const i = maxIndex(d[colorKey], (e) => r[e]?.count);
          return colorsCategory(d[colorKey][i]);
        } else {
          return colorsCategory(d[colorKey]);
        }
      },
    });
  }, [rankdata]);
  const metricListOp = useMemo(
    () => metricList.map((d) => ({ value: d.key, label: d.label })),
    [metricList]
  );
  return (
    <div className="relative h-full p-5 space-y-4 overflow-y-auto">
      {/* <div>
        <Select value={source} onValueChange={onChangeSource}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Viz source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event">Event list</SelectItem>
            <SelectItem value="selected">Selected list</SelectItem>
          </SelectContent>
        </Select>
      </div> */}
      <Card className="overflow-y-auto bg-muted p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Top 10</h3>
            <div className="max-w-100">
              <Select value={colorKey} onValueChange={setColorKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Metric" />
                </SelectTrigger>
                <SelectContent>
                  {rankMetricList.map(({ key, label }) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <PlotlHolder
          title={`Top 10 ${colorKey}`}
          isHideTitle={true}
          type="ranking"
        >
          <Barchart data={rankdata} />
        </PlotlHolder>
      </Card>
      <Separator className="my-4" />
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-primary">
            Track histogram
          </h3>
          <div>
            <InputMultiSelect
              options={metricListOp}
              value={histMetrics}
              onValueChange={(value) => onChangehistMetrics(value)}
            >
              {(provided) => <InputMultiSelectTrigger {...provided} />}
            </InputMultiSelect>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center text-center">
        {histindata.map(({ key, label, data }) => (
          <div key={key} className="w-full relative flex flex-col">
            <div key={key} className="w-full aspect-[2/1]">
              <PlotlHolder title={label} type="histogram">
                <HistogramDis name={label} data={data} theme={theme} />
              </PlotlHolder>
            </div>
            {/* <h4>{label}</h4> */}
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-primary">2D Plot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 justify-center text-center w-full">
          <TwoDPlot
            metricListOp={metricListOp}
            scatterMetrics={scatterMetrics}
            onChangescatterMetrics={onChangescatterMetrics}
            scatterdata={scatterdata}
            theme={theme}
          />
          <MapWrapper />
        </div>
      </div>
      <Separator className="my-4" />
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-primary">nD Plot</h3>
        <div className="text-center w-max-300 w-full">
          <PlotlHolder title={"Radar chart"} type="radar" chartData={radardata}>
            <AutoSizer style={{ height: 300, width: "100%" }}>
              {({ height, width }) => {
                return (
                  <RadarChart
                    meanradar={radardata.data?.mean}
                    axisInfo={radardata.data?.metricInfo}
                    bandradar={radardata.data?.band}
                    height={height - 40}
                    width={width}
                  />
                );
              }}
            </AutoSizer>
          </PlotlHolder>
        </div>
        <div className="text-center w-max-300 w-full">
          <PlotlHolder
            title={"Parallel Coordinates"}
            type="parallelCoordinatesPlot"
            chartData={radardata}
          >
            <AutoSizer style={{ height: 300, width: "100%" }}>
              {({ height, width }) => {
                return (
                  <ParallelCoordinatesPlot
                    meanradar={radardata.data?.mean}
                    axisInfo={radardata.data?.metricInfo}
                    bandradar={radardata.data?.band}
                    height={height - 40}
                    width={width}
                  />
                );
              }}
            </AutoSizer>
          </PlotlHolder>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-primary">nD Plot</h3>
        <div className="text-center w-max-300 w-full">
          <PlotlHolder
            title={network?.label}
            type="network"
            chartData={network?.data}
          >
            <AutoSizer style={{ height:"300px",width: "100%" }}>
              {({ height, width }) => {
                return <NetworkVisualizationContainer fetchNetworkData={(opt)=>onChangeNetwork(opt)} data={network?.data} />;
              }}
            </AutoSizer>
          </PlotlHolder>
        </div>
      </div>
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Scatterwrapper
          data={data}
          selectList={metricList}
          onSelect={onSelect}
          onHover={onHover}
          hovered={hovered}
          getColor={rankMap}
        />
        <PCAplot
          data={data}
          selectList={metricList}
          onSelect={onSelect}
          onHover={onHover}
          hovered={hovered}
          getColor={rankMap}
        />
      </div> */}
    </div>
  );
}

export default VizPanel;
