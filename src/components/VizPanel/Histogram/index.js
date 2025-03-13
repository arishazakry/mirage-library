"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import "./index.css";
import { color } from "d3";

export default function Histogram({ data, name, theme = {} }) {
  const [_data, set_Data] = useState([]);
  useEffect(() => {
    set_Data([
      {
        x: data,
        type: "histogram",
        marker: {
          color: theme.primaryColor,
          line: {
            color: color(theme.primaryColor)?.brighter(4).toString(),
            width: 1,
          },
        },
      },
    ]);
  }, [data, theme.primaryColor]);
  return (
    <Plot
      data={_data}
      layout={{
        xaxis: { title: name },
        yaxis: { showline: false, showticklabels: false, zeroline: false },
        font: {
          family: theme.fontFamily,
          size: theme.fontSize,
          color: "inherit",
        },
        margin: { t: 10, r: 10, l: 10, b: 20 },
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent", //theme.palette.background.paper,
      }}
      style={{ width: "100%", height: "100%" }}
      config={{
        displaylogo: false,
        toImageButtonOptions: {
          format: "svg", //one of png, svg, jpeg, webp 'svg'
          filename: "Histogram",
          scale: 1, // # Multiply title/legend/axis/canvas sizes by this factor
        },
        showEditInChartStudio: true,
        plotlyServerURL: "https://chart-studio.plotly.com",
      }}
    />
  );
}
