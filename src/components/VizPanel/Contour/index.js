import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { extent, range, scaleBand, scaleQuantize, scaleSqrt } from "d3";
import { metricList } from "@/lib/utils";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import "./index.css";
import scatter2bin from "../binutil";

export default function Contour({
  data: raw,
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
    if (!raw) return;
    let data = { ...raw };
    if (raw.mode != "binned") {
      // binning data
      data = { ...data, ...scatter2bin(raw.data, 50), mode: "scatter" };
    }
    if (data.data.length) {
      const xScale = scaleQuantize()
        .range(range((data.xrange[1] - data.xrange[0]) / data.stepX))
        .domain(data.xrange);
      const yScale = scaleQuantize()
        .range(range((data.yrange[1] - data.yrange[0]) / data.stepY))
        .domain(data.yrange);
      const z = yScale.range().map(() => xScale.range().map(() => null));
      const x = xScale.range().map((d) => (d + 0.5) * data.stepX);
      const y = yScale.range().map((d) => (d + 0.5) * data.stepY);
      data.data.forEach((d) => {
        z[yScale(d.y)][xScale(d.x)] = Math.log10(d.count);
      });
      const trace = [
        {
          x,
          y,
          z,
          type: "contour",
          hoverongaps: false,
          colorbar: {
            thickness: 5,
            len: 1,
            xpad: 2,
            title: "Count",
          },
        },
      ];

      set_Data(trace);
    } else set_Data([]);
  }, [raw, hovered, color]);
  const handleSelected = (event) => {
    const points = event.points;
    const selected = {};
    points.forEach((point) => (selected[point.data._id] = true));

    onSelected(selected);
  };
  useEffect(() => {
    const title = { x: xname, y: yname };
    if (raw) {
      const xname = raw?.metric?.[0];
      const yname = raw?.metric?.[1];
      if (xname) title.x = metricList.find((d) => d.key === xname)?.label;
      if (yname) title.y = metricList.find((d) => d.key === yname)?.label;
    }
    setTitle(title);
  }, [raw, xname, yname]);
  return (
    <div ref={containerRef} className="w-full h-full min-h-[50px]">
      <Plot
        data={_data}
        layout={{
          autosize: true,
          responsive: true,
          width: size.width,
          height: size.height,
          xaxis: { title: { text: title.x, standoff: 5 } },
          yaxis: { title: { text: title.y, standoff: 5 } },
          font: {
            family: theme.fontFamily,
            size: theme.fontSize,
            color: "inherit",
          },
          autoscale: false,
          height: height,
          width: width,
          margin: { t: 5, r: 5, b: 45, l: 45 },
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
            onSelect(raw.data[point.pointIndex]);
          }
        }}
        onHover={(event) => {
          if (event.points && event.points.length > 0) {
            const pointIndex = event.points[0].pointIndex;
            onHover(raw.data[pointIndex]);
          }
        }}
      />
    </div>
  );
}
