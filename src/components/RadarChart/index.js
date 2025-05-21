"use client";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState, useMemo } from "react";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
const emptyArray = [];
export default function RadarChart({
  inputData,
  axisInfo = emptyArray,
  height,
  width,
  highlight,
  meanradar,
  bandradar,
}) {
  const theme = useTheme();
  let [data, setData] = useState([]);
  useEffect(() => {
    if (axisInfo.length) {
      const data =
        inputData && inputData.length
          ? inputData.map((d) => {
              const item = {
                type: "scatterpolar",
                r: [],
                theta: [],
                fill: "toself",
                name: "current event",
              };
              axisInfo.forEach((k, ki) => {
                item.r[ki] = d[k.key] ?? undefined;
                item.theta[ki] = k.label;
              });
              item.r.push(item.r[0]);
              item.theta.push(item.theta[0]);
              return item;
            })
          : [];
      if (bandradar) {
        const { lowerBound, upperBound } = bandradar;
        const lower = [...lowerBound, lowerBound[0]];
        const upper = [...upperBound, upperBound[0]];
        const theta = [];
        axisInfo.forEach((k, ki) => {
          theta[ki] = k.label;
        });
        theta.push(theta[0]);
        const lowerTrace = {
          type: "scatterpolar",
          r: lower,
          theta,
          fill: "none",
          line: { color: "transparent" },
          showlegend: false,
        };

        const upperTrace = {
          type: "scatterpolar",
          r: upper,
          theta,
          fill: "tonext", // Fill to the previous trace
          name: "Score Band",
          fillcolor: "rgba(0, 100, 200, 0.2)",
          line: { color: "blue" },
        };
        data.push(lowerTrace, upperTrace);
      }
      if (meanradar) {
        const item = {
          type: "scatterpolar",
          r: [],
          theta: [],
          line: {
            dash: "dash", // Dash line for the trace
          },
          name: "mean",
        };
        data.push(item);
        axisInfo.forEach((k, ki) => {
          item.r[ki] = meanradar[k.key] ?? undefined;
          item.theta[ki] = k.label;
        });
        item.r.push(item.r[0]);
        item.theta.push(item.theta[0]);
      }
      setData(data);
    } else {
      setData([]);
    }
  }, [inputData, meanradar, axisInfo]);
  let layout = useMemo(
    () => ({
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      autoscale: false,
      height: height,
      width: width,
      margin: { t: 40, r: 20, l: 20, b: 40 },
      font: {
        family: theme.typography.fontFamily,
        size: theme.typography.fontSize,
        color: theme.palette.text.primary,
      },
      polar: {
        radialaxis: {
          visible: true,
          range: [0, 1],
        },
      },
      showlegend: false,
    }),
    [height, width, theme]
  );
  return (
    <Plot
      data={data}
      layout={layout}
      config={{
        displaylogo: false,
        toImageButtonOptions: {
          format: "svg", //one of png, svg, jpeg, webp 'svg'
          filename: "Station_Map",
          height: 1080,
          width: 1920,
          scale: 1, // # Multiply title/legend/axis/canvas sizes by this factor
        },
        showEditInChartStudio: true,
        plotlyServerURL: "https://chart-studio.plotly.com",
        // '#Station':false
      }}
    />
  );
}
