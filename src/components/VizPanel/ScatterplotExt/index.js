import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { extent, scaleSqrt } from "d3";
import { metricList } from "@/lib/utils";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import "./index.css";

export default function ScatterplotExt({
  data,
  xname,
  yname,
  height,
  width,
  onSelected = () => {},
  onSelect = () => {},
  onHover = () => {},
  config = {},
  hovered,
  color,
  theme = {},
}) {
  const [_data, set_Data] = useState([]);
  const [title, setTitle] = useState({});
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 400, height: 400 });
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
    if (!data) return;
    console.log(data);
    const x = [];
    const y = [];
    const r = [];
    data.data.forEach((d) => {
      x.push(d.x);
      y.push(d.y);
    });
    if (data.mode == "binned") {
      const scaler = scaleSqrt()
        .domain(extent(data.data, (d) => d.count))
        .range([5, 20]);
      data.data.forEach((d) => {
        r.push(scaler(d.count));
      });
    }
    const trace = [
      {
        x,
        y,
        type: "scatter",
        mode: "markers",
        marker: {
          color: color ?? undefined,
          size: data.mode == "binned" ? r : 5,
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
  useEffect(() => {
    const title = { x: xname, y: yname };
    if (data) {
      const xname = data?.metric?.[0];
      const yname = data?.metric?.[1];
      if (xname) title.x = metricList.find((d) => d.key === xname)?.label;
      if (yname) title.y = metricList.find((d) => d.key === yname)?.label;
    }
    setTitle(title);
  }, [data, xname, yname]);
  return (
    <div ref={containerRef} className="w-full h-full min-h-[50px]">
      <Plot
        data={_data}
        layout={{
          autosize: true,
          responsive: true,
          width: size.width,
          height: size.height,
          xaxis: { title: { text: title.x } },
          yaxis: { title: { text: title.y } },
          font: {
            family: theme.fontFamily,
            size: theme.fontSize,
            color: "inherit",
          },
          autoscale: false,
          height: height,
          width: width,
          margin: { t: 10, r: 10 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
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
          ...config,
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
    </div>
  );
}
