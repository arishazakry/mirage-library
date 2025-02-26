"use client";

import { forwardRef, useEffect, useState } from "react";
import FilterSlider from "../FilterSlider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FilterSliderWrapper = forwardRef(
  ({ className, mode, value, onValueChange, ...props }, ref) => {
    const [_mode, setMode] = useState(mode ?? "range");
    const [_value, setValue] = useState(value ?? [20, 80]);
    useEffect(() => {
      setMode(mode);
    }, [mode]);
    useEffect(() => {
      setValue(value);
    }, [value]);

    const handleModeChange = (newMode) => {
      setMode(newMode);
      const newv =
        newMode === "range"
          ? [_value[0], props.max ?? _value[0]]
          : [_value[0] ?? props.min];
      setValue(newv);
      if (onValueChange) onValueChange({ value: newv, mode: newMode });
    };

    const handleSliderChange = (newMode, newValue) => {
      setValue(newValue);
      if (onValueChange) onValueChange({ value: newValue, mode: newMode });
    };

    return (
      <div
        className={cn("space-y-4 p-4 border rounded-lg", className)}
        ref={ref}
      >
        {/* Chọn mode */}
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium">Mode:</span>
          <Select onValueChange={handleModeChange} value={_mode}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lower">Lower</SelectItem>
              <SelectItem value="greater">Greater</SelectItem>
              <SelectItem value="range">Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Component Slider */}
        <FilterSlider
          mode={_mode}
          value={_value}
          onChange={handleSliderChange}
          {...props}
        />
      </div>
    );
  }
);

export default FilterSliderWrapper;
