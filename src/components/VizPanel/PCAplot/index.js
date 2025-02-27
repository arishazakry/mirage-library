import React, { useEffect, useMemo, useState } from "react";
import { PCA } from "ml-pca";
import Scatterplot from "../Scatterplot";
import AutoSizer from "react-virtualized-auto-sizer";
import Barchart from "../Barchart";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import Histogram from "../Histogram";

function PCAplot({ data, selectList, onSelect, onHover, hovered, getColor }) {
  const [axis, setAxis] = useState(selectList.map((d) => d.key));
  const [scatterdata, setScatterdata] = useState({ x: [], y: [], data: [] });
  const [highlight, sethighlight] = useState({ x: [], y: [], data: [] });
  const [pcaob, setpcaob] = useState();
  const [color, setcolor] = useState([]);
  const selectListMap = useMemo(() => {
    const m = {};
    selectList.forEach((d) => {
      m[d.key] = d;
    });
    return m;
  }, [selectList]);
  useEffect(() => {
    const dataMatrix = [];
    const dataValid = [];
    try {
      data.forEach((d) => {
        let valid = true;
        const m = [];
        axis.forEach((key) => {
          if (isNaN(d[key])) valid = false;
          else m.push(d[key]);
        });
        if (valid) {
          dataMatrix.push(m);
          dataValid.push(d);
        }
      });

      const pca = new PCA(dataMatrix);
      const result = pca.predict(dataMatrix);
      // PCA 2 comp
      const principalComponent1 = result.data.map((row) => row[0]);
      const principalComponent2 = result.data.map((row) => row[1]);

      const explain = pca.getExplainedVariance();
      const scatterdata = {
        x: principalComponent1,
        y: principalComponent2,
        data: dataValid,
        xname: `PC1 (${Math.round(explain[0] * 1000) / 10}%)`,
        yname: `PC2 (${Math.round(explain[1] * 1000) / 10}%)`,
      };
      setpcaob(pca);
      setScatterdata(scatterdata);
    } catch (e) {
      setScatterdata({ x: [], y: [], data: [], xname: "PC1", yname: "PC2" });
      setpcaob(null);
    }
  }, [data, axis]);
  useEffect(() => {
    setcolor(scatterdata.data.map((row) => getColor.getColor(row)));
  }, [scatterdata.data, getColor]);
  useEffect(() => {
    if (hovered && pcaob)
      try {
        const m = [];
        let valid = true;
        axis.forEach((key) => {
          if (isNaN(hovered[key])) valid = false;
          else m.push(hovered[key]);
        });
        if (valid) {
          const p = pcaob.predict([m]);
          sethighlight({
            x: [p.data[0][0]],
            y: [p.data[0][1]],
            data: [hovered],
          });
        } else {
          throw Error("Hover point invalid");
        }
      } catch (e) {
        sethighlight({ x: [], y: [], data: [] });
      }
    else sethighlight({ x: [], y: [], data: [] });
  }, [axis, hovered, pcaob]);
  return (
    <div className="relative h-full p-5 space-y-4">
      <div className="space-y-4">
        <div className="max-w-md">
          <p className="text-sm font-medium">PCA Axis</p>
          <Select
            multiple
            value={axis}
            onValueChange={(value) => setAxis(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select PCA Axes" />
            </SelectTrigger>
            <SelectContent>
              {selectList.map(({ key, label }) => (
                <SelectItem key={`pca-s-${key}`} value={key}>
                  <Checkbox checked={axis.includes(key)} />
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full h-[400px] relative">
          <AutoSizer style={{ height: "100%", width: "100%" }} disableHeight>
            {({ height, width }) => {
              return (
                <Scatterplot
                  data={scatterdata}
                  xname={scatterdata.xname}
                  yname={scatterdata.yname}
                  color={color}
                  width={width}
                  height={width}
                  onSelect={onSelect}
                  onHover={onHover}
                  hovered={highlight}
                />
              );
            }}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
}
export default PCAplot;
