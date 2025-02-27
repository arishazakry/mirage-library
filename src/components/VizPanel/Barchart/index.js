import React, { useEffect, useMemo, useState } from "react";
import { scaleLinear, extent } from "d3";
export default function Barchart({ data, fullHeight }) {
  const widthScale = useMemo(() => {
    return scaleLinear()
      .range([0.1, 1])
      .domain(
        extent(data, (d) => {
          return d?.count;
        })
      );
  }, [data]);

  return (
    <div className="flex">
      <div
        className="max-w-[300px] text-right overflow-y-auto"
        style={{ maxHeight: fullHeight ? "auto" : "30vh" }}
      >
        {data.map((d) => (
          <p key={d.title} className="text-sm font-medium">
            {d.title}
          </p>
        ))}
      </div>

      <div
        className="flex-grow overflow-y-auto"
        style={{ maxHeight: fullHeight ? "auto" : "30vh" }}
      >
        {data.map((d) => (
          <div key={d.title} className="text-sm font-medium flex items-center">
            <div
              className="inline-block h-2 mr-2"
              style={{
                width: `${80 * (widthScale(d.count) ?? 1)}%`,
                backgroundColor: d.color,
              }}
            ></div>
            {d.count}
          </div>
        ))}
      </div>
    </div>
  );
}
