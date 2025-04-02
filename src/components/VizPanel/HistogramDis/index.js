"use client";
import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import "./index.css";
import { color } from "d3";

export default function HistogramDis({ data, name, theme = {}, config = {} }) {
  const [_data, set_Data] = useState([]);

  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 400, height: 300 }); // Default size
  // Detect container resize
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setSize({ width, height });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    set_Data([
      {
        x: (data.x ?? []).map((d) => d[1].toFixed(2)),
        y: data.y ?? [],
        type: "bar",
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
    <div ref={containerRef} className="w-full h-full min-h-[50px]">
      <Plot
        data={_data}
        layout={{
          autosize: true,
          responsive: true,
          width: size.width, // ✅ Updates when container resizes
          height: size.height, // ✅ Updates when container resizes
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
          barcornerradius: 15,
        }}
        style={{ width: "100%", height: "100%", minHeight: "100px" }}
        config={{
          displaylogo: false,
          responsive: true,
          toImageButtonOptions: {
            format: "svg", //one of png, svg, jpeg, webp 'svg'
            filename: "Histogram",
            scale: 1, // # Multiply title/legend/axis/canvas sizes by this factor
          },
          showEditInChartStudio: true,
          plotlyServerURL: "https://chart-studio.plotly.com",
          ...config, // Merge with default config
        }}
      />
    </div>
  );
}
