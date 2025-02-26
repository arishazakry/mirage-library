"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";

const FilterSlider = ({ mode, value, onChange, min = 0, max = 100 }) => {
  const [tempValue, setTempValue] = useState(value);
  const [dragging, setDragging] = useState(null); // "left" | "right"
  useEffect(() => {
    setTempValue(value);
  }, [value]);
  const handleChange = (newValue) => {
    if (mode === "range") {
      let newRange = [...value];

      if (dragging === "left") {
        newRange[0] = Math.min(newValue[0], newRange[1] - 1); // Giữ trái < phải
      } else if (dragging === "right") {
        newRange[1] = Math.max(newValue[1], newRange[0] + 1); // Giữ phải > trái
      }

      setTempValue(newValue);
    } else {
      setTempValue([newValue[0], newValue[0]]);
    }
  };

  const handlePointerDown = (e) => {
    const sliderRect = e.target.getBoundingClientRect();
    const clickPercent =
      ((e.clientX - sliderRect.left) / sliderRect.width) * 100;

    const leftDiff = Math.abs(
      clickPercent - ((value[0] - min) / (max - min)) * 100
    );
    const rightDiff = Math.abs(
      clickPercent - ((value[1] - min) / (max - min)) * 100
    );

    setDragging(leftDiff < rightDiff ? "left" : "right");
  };
  const handleCommit = (newValue) => {
    setDragging(null);
    onChange(mode, newValue);
  };
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      {/* Slider */}
      {mode === "range" ? (
        <Slider
          min={min}
          max={max}
          step={1}
          value={tempValue}
          onValueChange={handleChange}
          onValueCommit={handleCommit}
          onPointerDown={handlePointerDown}
          onPointerUp={() => setDragging(null)}
        />
      ) : (
        <Slider
          min={min}
          max={max}
          step={1}
          value={[tempValue[0]]}
          onValueChange={handleChange}
          onValueCommit={handleCommit}
        />
      )}

      {/* Hiển thị giá trị */}
      <div className="text-sm text-gray-600">
        {mode === "lower" && `≤ ${tempValue[0]}`}
        {mode === "greater" && `≥ ${tempValue[0]}`}
        {mode === "range" && `${tempValue[0]} - ${tempValue[1]}`}
      </div>
    </div>
  );
};

export default FilterSlider;
