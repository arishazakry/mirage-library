import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import DetailCard from "../DetailCard";

export default function DetailView({
  currentDetail,
  onSelect,
  meanradar,
  className = "",
}) {
  return (
    <Card className={`w-full bg-background ${className}`}>
      <CardContent className="h-full relative">
        <div className="h-full w-full p-2.5 overflow-auto flex flex-col flex-nowrap bg-background text-foreground">
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
      </CardContent>
    </Card>
  );
}
