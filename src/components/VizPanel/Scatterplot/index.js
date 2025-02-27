import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function Scatterplot({
  data,
  xname,
  yname,
  height,
  width,
  onSelected,
  onSelect,
  onHover,
  hovered,
  color,
}) {
  const theme = useTheme();
  const [_data, set_Data] = useState([]);
  useEffect(() => {
    const trace = [
      {
        x: data.x,
        y: data.y,
        type: "scatter",
        mode: "markers",
        marker: {
          color: color ?? undefined,
          size: 5,
        },
      },
    ];
    if (hovered)
      trace.push({
        x: hovered.x,
        y: hovered.y,
        type: "scatter",
        mode: "markers",
        marker: {
          color: "rgba(0,0,0,0)",
          size: 8,
          line: {
            color: "white", // Màu viền
            width: 2, // Độ rộng viền
          },
        },
        hoverinfo: "skip",
      });
    set_Data(trace);
  }, [data, hovered, color]);
  const handleSelected = (event) => {
    const points = event.points;
    const selected = {};
    points.forEach((point) => (selected[point.data._id] = true));

    onSelected(selected);
  };
  return (
    <Plot
      data={_data}
      layout={{
        xaxis: { title: xname },
        yaxis: { title: yname },
        font: {
          family: theme.typography.fontFamily,
          size: theme.typography.fontSize,
          color: theme.palette.text.primary,
        },
        autoscale: false,
        height: height,
        width: width,
        margin: { t: 10, r: 10 },
        paper_bgcolor: theme.palette.background.paper,
        plot_bgcolor: "rgba(0,0,0,0)", //theme.palette.background.paper,
        showlegend: false,
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
      onSelected={handleSelected}
      onClick={(event) => {
        if (event.points && event.points.length > 0) {
          const point = event.points[0];
          onSelect(data.data[point.pointIndex]);
        }
      }}
      onHover={(event) => {
        if (event.points && event.points.length > 0) {
          const pointIndex = event.points[0].pointIndex;
          onHover(data.data[pointIndex]);
        }
      }}
    />
  );
}
