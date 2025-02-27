import { Grid, MenuItem, TextField } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import Scatterplot from "../Scatterplot";
import AutoSizer from "react-virtualized-auto-sizer";

function Scatterwrapper({
  data,
  selectList,
  onSelect,
  onHover,
  hovered,
  getColor,
}) {
  const [axis, setAxis] = useState({
    x: selectList[0].key,
    y: selectList[1].key,
  });
  const [scatterdata, setScatterdata] = useState({ x: [], y: [], data: [] });
  const [highlight, sethighlight] = useState({ x: [], y: [], data: [] });
  const [color, setcolor] = useState([]);
  const selectListMap = useMemo(() => {
    const m = {};
    selectList.forEach((d) => {
      m[d.key] = d.label;
    });
    return m;
  }, [selectList]);
  useEffect(() => {
    const scatterdata = { x: [], y: [], data: [] };
    data.forEach((d) => {
      scatterdata.x.push(d[axis.x]);
      scatterdata.y.push(d[axis.y]);
      scatterdata.data.push(d);
    });
    setScatterdata(scatterdata);
  }, [axis, data]);
  useEffect(() => {
    if (scatterdata.data)
      setcolor(scatterdata.data.map((d) => getColor.getColor(d)));
  }, [scatterdata, getColor]);
  useEffect(() => {
    if (hovered)
      sethighlight({
        x: [hovered[axis.x]],
        y: [hovered[axis.y]],
        data: [hovered],
      });
    else sethighlight({ x: [], y: [], data: [] });
  }, [axis, hovered]);
  return (
    <Grid container direction={"column"} sx={{ m: 1 }}>
      <Grid container item spacing={1}>
        <Grid item xs={6}>
          <TextField
            id="viz-selection-scatterx"
            select
            label="X axis"
            value={axis.x}
            variant="outlined"
            size="small"
            fullWidth
            onChange={(event) => {
              setAxis({ ...axis, x: event.target.value });
            }}
          >
            {selectList.map(({ key, label }) => (
              <MenuItem key={`x-s-${key}`} value={key}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6}>
          <TextField
            id="viz-selection-scatterx"
            select
            label="Y axis"
            value={axis.y}
            size="small"
            variant="outlined"
            fullWidth
            onChange={(event) => {
              setAxis({ ...axis, y: event.target.value });
            }}
          >
            {selectList.map(({ key, label }) => (
              <MenuItem key={`y-s-${key}`} value={key}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      <Grid item xs={12} sx={{ position: "relative" }}>
        <AutoSizer style={{ height: "100%", width: "100%" }} disableHeight>
          {({ height, width }) => {
            return (
              <Scatterplot
                data={scatterdata}
                xname={selectListMap[axis.x]}
                yname={selectListMap[axis.y]}
                width={width}
                height={width}
                onSelect={onSelect}
                onHover={onHover}
                hovered={highlight}
                color={color}
              />
            );
          }}
        </AutoSizer>
      </Grid>
    </Grid>
  );
}
export default Scatterwrapper;
