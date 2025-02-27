import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function Histogram({ data, name }) {
  const theme = useTheme();
  const [_data, set_Data] = useState([]);
  useEffect(() => {
    set_Data([
      {
        x: data,
        type: "histogram",
        marker: {
          color: "rgba(100,250,100,0.7)",
          line: {
            color: "rgba(100,250,100,1)",
            width: 1,
          },
        },
      },
    ]);
  }, [data]);
  return (
    <Plot
      data={_data}
      layout={{
        xaxis: { title: name },
        yaxis: { showline: false, showticklabels: false, zeroline: false },
        font: {
          family: theme.typography.fontFamily,
          size: theme.typography.fontSize,
          color: theme.palette.text.primary,
        },
        margin: { t: 10, r: 10, l: 10, b: 40 },
        paper_bgcolor: theme.palette.background.paper,
        plot_bgcolor: "rgba(0,0,0,0)", //theme.palette.background.paper,
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
