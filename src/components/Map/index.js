import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import {
  color as d3color,
  extent,
  scaleLinear,
  range as d3range,
  interpolateNumber,
} from "d3";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
import "./index.css";

const countriesScale = scaleLinear().range([5, 20]);
const zoomi = scaleLinear()
  .domain([
    0.0007, 0.0014, 0.003, 0.006, 0.012, 0.024, 0.048, 0.096, 0.192, 0.3712,
    0.768, 1.536, 3.072, 6.144, 11.8784, 23.7568, 47.5136, 98.304, 190.0544,
    360.0,
  ])
  .range(d3range(0, 20).map((d) => 20 - d));
export default function Map({
  type,
  locs,
  height,
  width,
  highlight,
  config = {},
}) {
  const theme = useTheme();
  let [data, setData] = useState([]);
  let [domain, setDomain] = useState({ center: { lon: 0, lat: 0 }, zoom: 1 });
  useEffect(() => {
    try {
      if (locs.length) {
        // const botColor = d3color(theme.palette.text.primary);
        // botColor.opacity = highlight?0.5:1;
        const _botColor = theme.palette.primary.main;
        countriesScale.domain(extent(locs, (d) => d?.count));
        let lon = [];
        let lat = [];
        let z = [];
        let size = [];
        let text = [];
        // let color=[];
        locs.forEach((d) => {
          lon.push(d.long);
          lat.push(d.lat);
          z.push(d?.count);
          size.push(countriesScale(d?.count));
          text.push(`${d["title"]} (${d?.count})`);
          // color.push((highlight&&(highlight.Location_RG_country===d['title']))? 'red':_botColor);
        });
        // console.log(highlight,color)
        let ticks = countriesScale.ticks(2);
        let tsize = ticks.map((t) => countriesScale(t));
        let tickS = ticks.map((t, i) => ({
          map: "mapTick",
          type: "scattermap",
          name: `${t}`,
          lon: [0],
          lat: [0],
          x: [0],
          y: [0],
          marker: {
            color: _botColor,
            size: tsize[i],
          },
          visible: "legendonly",
        }));
        const longd = extent(locs, (d) => d?.long); // [-180,180]
        const latd = extent(locs, (d) => d?.lat); // [-90,90]
        const center = {
          lon: (longd[1] + longd[0]) / 2,
          lat: (latd[1] + latd[0]) / 2,
        };
        const magrin = 1.2;
        const zoom = Math.min(
          10,
          Math.min(
            zoomi((longd[1] - longd[0]) * magrin * 2),
            zoomi((latd[1] - latd[0]) * magrin)
          ) / 1.5
        );
        if (type !== "heatmap_map") {
          let data = [
            {
              type: "scattermap",
              lon,
              lat,
              hoverinfo: "text",
              text,
              showlegend: false,
              marker: {
                size,
                color: _botColor,

                line: {
                  color: "black",
                },
              },
              name: "stream",
            },
            ...tickS,
          ];

          if (highlight) {
            const _highlight = locs.find(
              (d) => d["location_rg_id"] === highlight.location_rg_id
            );
            if (_highlight) {
              data.push({
                type: "scattermap",
                // locationmode: 'world',
                lon: [_highlight.long],
                lat: [_highlight.lat],
                hoverinfo: "text",
                text: [`${_highlight["title"]} (${_highlight?.count})`],
                showlegend: true,
                // subplot: "map",
                marker: {
                  size: [countriesScale(_highlight.count)],
                  color: "red",
                  line: {
                    color: "black",
                  },
                },
                name: _highlight["title"],
              });
            }
          }
          setData(data);
          setDomain({ zoom, center });
        } else {
          let data = [
            {
              type: "densitymap",
              lon,
              lat,
              z,
              hoverinfo: "text",
              text,
              showlegend: false,
              coloraxis: "coloraxis",
              radius: 20,
              name: "heat",
              colorbar: {
                thickness: 5,
                len: 1,
                xpad: 2,
                title: "Count",
              },
            },
          ];
          setData(data);
          setDomain({ zoom, center });
        }
      } else setData([]);
    } catch (e) {}
  }, [type, locs, highlight]);
  // console.log(domain.center,domain.zoom)
  let layout = useMemo(
    () => ({
      paper_bgcolor: theme.palette.background.paper,
      plot_bgcolor: "rgba(0,0,0,0)", //theme.palette.background.paper,
      autoscale: false,
      height: height,
      width: width,
      margin: { t: 10, r: 10, l: 10, b: 10 },
      mapTick: {
        style: "whitebg",
      },
      map: {
        style: "carto-positron",
        center: domain.center,
        zoom: domain.zoom,
      },
      font: {
        family: theme.typography.fontFamily,
        size: theme.typography.fontSize,
        color: theme.palette.text.primary,
      },
      legend: {
        title: { text: "#Streams" },
        showticksuffix: "last",
        x: 1,
        xanchor: "right",
        y: 0,
        orientation: "h",
      },
      coloraxis: { colorscale: "Viridis" },
      style: "outdoors",
    }),
    [height, width, theme, domain]
  );
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null; // avoid mismatch
  return (
    <Plot
      data={data}
      layout={layout}
      config={{
        displaylogo: false,
        toImageButtonOptions: {
          format: "svg", //one of png, svg, jpeg, webp 'svg'
          filename: "Station_Map",
          height: 1080,
          width: 1920,
          scale: 1, // # Multiply title/legend/axis/canvas sizes by this factor
        },
        showEditInChartStudio: true,
        plotlyServerURL: "https://chart-studio.plotly.com",
        "#Station": false,
        ...config,
      }}
    />
  );
}
