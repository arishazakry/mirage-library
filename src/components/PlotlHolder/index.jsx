import { generateChartId, useChartStore } from "@/store/chartstore";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { SaveIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import useStore from "@/store/strore";
import { useSelector } from "react-redux";
import { selectFilters } from "@/store/reducer/streamfilters";

export default function PlotlHolder({
  children,
  hideSaveButton = false,
  type,
  onSave,
  title,
  chartData,
}) {
  const { query } = useStore();
  const filters = useSelector(selectFilters);
  const addChart = useChartStore((state) => state.addChart);

  const chart_id = useMemo(
    () => generateChartId({ filters, query, title, type }),
    [filters, query, title, type]
  );

  const handleSave = () => {
    // Get data from props or try to extract from children
    const dataToSave = chartData || children?.props?.data;
    // const layoutToSave = layout || children?.props?.layout;

    if (dataToSave) {
      const chartToSave = {
        id: chart_id,
        data: dataToSave,
        title: title || "Unnamed Chart",
        type,
        filters,
        query,
      };
      console.log(chartToSave);
      addChart(chartToSave);

      if (onSave && typeof onSave === "function") {
        onSave(chartToSave);
      }
    }
  };

  return (
    <Card className="w-full h-full flex flex-col" id={chart_id}>
      <CardHeader className="px-4 py-3 relative">
        <CardTitle className="text-lg">{title}</CardTitle>
        {!hideSaveButton && (
          <Button
            onClick={handleSave}
            size="sm"
            className="flex items-center gap-2 absolute right-4 top-1/2 transform -translate-y-1/2"
            variant="outline"
          >
            <SaveIcon size={16} />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow px-4 py-2">
        <div className="w-full h-full">{children}</div>
      </CardContent>
    </Card>
  );
}
