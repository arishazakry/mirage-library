"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import Histogram from "./Histogram";
import Scatterwrapper from "./Scatterwrapper";
import PCAplot from "./PCAplot";
import { scaleOrdinal, maxIndex, rollup, color } from "d3";
import { isArray } from "lodash";
import Barchart from "./Barchart";
import { metricList, rankMetricList } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Separator } from "@radix-ui/react-select";
import { colorArr } from "../Earth3D";
import { Card } from "../ui/card";
import { useTheme } from "next-themes";
import HistogramDis from "./HistogramDis";
import PlotlHolder from "../PlotlHolder";

const TOP = 10;
function VizPanel({ data, source, onChangeSource, onSelect }) {
  const [histindata, sethisindata] = useState([]);
  const [rankdata, setrankdata] = useState([]);
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
    const histindata = metricList.map(({ key, label }) => ({
      key,
      label,
      data: data?.his?.[key] ?? {},
    }));
    sethisindata(histindata);
  }, [data]);
  const onHover = useCallback((data) => {
    sethovered(data);
  }, []);

  const [rankMap, setrankMap] = useState({
    data: {},
    colorsCategory: () => {},
    getColor: () => {},
  });

  useEffect(() => {
    // const countMap = {};
    // data?.rank?.forEach((d) => {
    //   if (isArray(d[colorKey])) {
    //     d[colorKey].forEach((e) => (countMap[e] = (countMap[e] ?? 0) + 1));
    //   } else if (d[colorKey] && d[colorKey] !== null) {
    //     countMap[d[colorKey]] = (countMap[d[colorKey]] ?? 0) + 1;
    //   }
    // });
    // let rankData = [];
    // Object.keys(countMap).forEach((k) => {
    //   rankData.push({ title: k, count: countMap[k] });
    // });
    // rankData.sort((a, b) => b.count - a.count);
    // rankData = rankData.slice(0, TOP);
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
  return (
    <div className="relative h-full p-5 space-y-4 overflow-y-auto">
      <div>
        <Select value={source} onValueChange={onChangeSource}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Viz source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event">Event list</SelectItem>
            <SelectItem value="selected">Selected list</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator>
        <h3 className="text-lg font-semibold text-primary">Track histogram</h3>
      </Separator>
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
      <Card className="overflow-y-auto bg-muted p-4">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold">Top 10</h3>
          <Select value={colorKey} onValueChange={setColorKey}>
            <SelectTrigger className="w-full">
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
        <Barchart data={rankdata} />
      </Card>
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
