import PlotlHolder from "@/components/PlotlHolder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Heatmap from "../Heatmap";
import Contour from "../Contour";
import { useEffect, useState } from "react";
import ScatterplotExt from "../ScatterplotExt";
import { metricList } from "@/lib/utils";

const options = [
  { key: "Scatter plot", value: "scatter" },
  { key: "Heatmap", value: "heatmap" },
  { key: "Contour", value: "contour" },
];
export default function TwoDPlot({
  metricListOp,
  scatterMetrics,
  onChangescatterMetrics,
  scatterdata,
  theme,
}) {
  const [plotType, setplotType] = useState("heatmap");
  const [titles, setTitles] = useState([]);
  useEffect(() => {
    const titles = scatterdata.map(({ data }) => {
      const title = { x: "", y: "" };
      if (data && data.metric) {
        const xname = data.metric?.[0];
        const yname = data.metric?.[1];
        if (xname)
          title.x = metricList.find((d) => d.key === xname)?.label ?? xname;
        if (yname)
          title.y = metricList.find((d) => d.key === yname)?.label ?? yname;
      }
      return title;
    });
    console.log(scatterdata, titles);
    setTitles(titles);
  }, [scatterdata]);
  return (
    <div>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-primary">2D Plot</h3>
          <div className="flex gap-2">
            <Select
              value={plotType}
              onValueChange={(value) => setplotType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Plot type" />
              </SelectTrigger>
              <SelectContent>
                {options.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={scatterMetrics[0]}
              onValueChange={(value) => onChangescatterMetrics(value, 0)}
            >
              <SelectTrigger>
                <SelectValue placeholder="x" />
              </SelectTrigger>
              <SelectContent>
                {metricListOp.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={scatterMetrics[1]}
              onValueChange={(value) => onChangescatterMetrics(value, 1)}
            >
              <SelectTrigger>
                <SelectValue placeholder="y" />
              </SelectTrigger>
              <SelectContent>
                {metricListOp.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 justify-center text-center">
        {plotType == "scatter" &&
          scatterdata.map(({ key, label, data }, index) => (
            <div
              key={`plot2d_${key}`}
              className="w-full relative flex flex-col"
            >
              <div className="w-full aspect-square">
                <PlotlHolder
                  title={`${titles[index]?.x} vs ${titles[index]?.y}`}
                  type="scatter"
                >
                  <ScatterplotExt
                    data={data}
                    theme={theme}
                    // onSelect={onSelect}
                    // onHover={onHover}
                    // hovered={hovered}
                    // getColor={rankMap}
                  />
                </PlotlHolder>
              </div>
              {/* <h4>{label}</h4> */}
            </div>
          ))}
        {plotType == "heatmap" &&
          scatterdata.map(({ key, label, data }, index) => (
            <div
              key={`plot2d_${key}`}
              className="w-full relative flex flex-col"
            >
              <div className="w-full aspect-square">
                <PlotlHolder
                  title={`${titles[index]?.x} vs ${titles[index]?.y}`}
                  type="heatmap"
                >
                  <Heatmap
                    data={data}
                    theme={theme}
                    // onSelect={onSelect}
                    // onHover={onHover}
                    // hovered={hovered}
                    // getColor={rankMap}
                  />
                </PlotlHolder>
              </div>
              {/* <h4>{label}</h4> */}
            </div>
          ))}
        {plotType == "contour" &&
          scatterdata.map(({ key, label, data }, index) => (
            <div
              key={`plot2d_${key}`}
              className="w-full relative flex flex-col"
            >
              <div className="w-full aspect-square">
                <PlotlHolder
                  title={`${titles[index]?.x} vs ${titles[index]?.y}`}
                  type="contour"
                >
                  <Contour
                    data={data}
                    theme={theme}
                    // onSelect={onSelect}
                    // onHover={onHover}
                    // hovered={hovered}
                    // getColor={rankMap}
                  />
                </PlotlHolder>
              </div>
              {/* <h4>{label}</h4> */}
            </div>
          ))}
      </div>
    </div>
  );
}
