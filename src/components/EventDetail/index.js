import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import DetailCard from "../DetailCard";
import { cn } from "@/lib/utils";

export default function EventDetail({
  currentDetail,
  onSelect,
  meanradar,
  className = "",
}) {
  return (
    <div
      className={cn(
        "flex flex-col p-2 gap-4 overflow-auto h-full w-full",
        className
      )}
    >
      {currentDetail ? (
        <DetailCard
          data={currentDetail}
          onSelect={onSelect}
          meanradar={meanradar}
        />
      ) : (
        <div>Select from Event List</div>
      )}
    </div>
  );
}
