"use client";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const emptyArray = [];

export default function ParallelCoordinatesPlot({
  inputData,
  axisInfo = emptyArray,
  height,
  width,
  highlight = null,
  meanradar = null,
  bandradar = null,
}) {
  const theme = useTheme();
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!axisInfo?.length) return setData([]);
    const colors = [];
    const dimensions = axisInfo.map((axis) => {
      const values = (inputData || []).map((item) => {
        colors.push(0);
        return item[axis.key] ?? null;
      });
      let min = Math.min(...values.filter((v) => v !== null));
      let max = Math.max(...values.filter((v) => v !== null));

      // Include mean/band values into range
      if (meanradar?.[axis.key] !== undefined) {
        min = Math.min(min, meanradar[axis.key]);
        max = Math.max(max, meanradar[axis.key]);
        values.push(meanradar[axis.key]);
        colors.push(1);
      }
      if (bandradar) {
        const { lowerBound, upperBound } = bandradar;
        const idx = axisInfo.indexOf(axis);
        min = Math.min(min, lowerBound[idx]);
        max = Math.max(max, upperBound[idx]);
        values.push(lowerBound[idx]);
        values.push(upperBound[idx]);
        colors.push(2, 2);
      }

      return {
        label: axis.label,
        range: [min, max],
        values, // Populated per trace
      };
    });

    setData([
      {
        type: "parcoords",
        line: {
          color: colors,
          colorscale: [
            [0, "rgba(0,100,200,0.4)"], // normal
            [1, "rgba(200,0,0,1)"], // mean line
            [1, "rgba(200,0,0,1)"], // mean line
          ],
          showscale: false,
        },
        dimensions: dimensions,
      },
    ]);
  }, [inputData, axisInfo, meanradar, bandradar, highlight]);

  const layout = useMemo(
    () => ({
      height: height || 400,
      width: width || 800,
      margin: { t: 40, r: 20, l: 20, b: 40 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      font: {
        family: theme.typography.fontFamily,
        size: theme.typography.fontSize,
        color: theme.palette.text.primary,
      },
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
          format: "svg",
          filename: "Parallel_Coordinates",
          height: 1080,
          width: 1920,
          scale: 1,
        },
      }}
    />
  );
}
