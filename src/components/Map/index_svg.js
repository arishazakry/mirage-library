import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { color as d3color, extent, scaleLinear, max as d3max } from "d3";
import "./index.css";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const countriesScale = scaleLinear().range([5, 20]);
export default function Map({ locs, height, width, highlight }) {
  const theme = useTheme();
  let [data, setData] = useState([]);
  let [domain, setDomain] = useState({ long: undefined, lat: undefined });
  useEffect(() => {
    // const botColor = d3color(theme.palette.text.primary);
    // botColor.opacity = highlight?0.5:1;
    const _botColor = theme.palette.text.primary;
    countriesScale.domain(extent(locs, (d) => d?.count));
    let lon = [];
    let lat = [];
    let size = [];
    let text = [];
    // let color=[];
    locs.forEach((d) => {
      lon.push(d.long);
      lat.push(d.lat);
      size.push(countriesScale(d?.count));
      text.push(`${d["title"]} (${d?.count})`);
      // color.push((highlight&&(highlight.Location_RG_Country===d['title']))? 'red':_botColor);
    });
    // console.log(highlight,color)
    let ticks = countriesScale.ticks(2);
    let tsize = ticks.map((t) => countriesScale(t));
    let tickS = ticks.map((t, i) => ({
      geo: "geo3",
      type: "scattergeo",
      mode: "markers",
      name: `${t}`,
      lon: [0],
      lat: [0],
      x: [0],
      y: [0],
      marker: {
        color: theme.palette.text.primary,
        size: tsize[i],
      },
      // xaxis: 'x2',
      // yaxis: 'y2',
      visible: "legendonly",
    }));
    let data = [
      {
        geo: "geo3",
        type: "scattergeo",
        mode: "markers",
        locationmode: "world",
        lon,
        lat,
        hoverinfo: "text",
        text,
        showlegend: false,
        marker: {
          size,
          color: _botColor,
          // cmin: 0,
          // cmax: 50,
          // colorscale: [
          //     ['0.0', theme.palette.secondary.light],
          //     ['1.0', theme.palette.primary.main]
          // ],
          // colorbar: {
          //     title: '#Streams',
          //     thickness: 10,
          //     // ticksuffix: '%',
          //     showticksuffix: 'last',
          //     x: 1,
          //     xanchor: 'right',
          //     yanchor: 'top',
          //     orientation: 'h'
          //     // y: 0
          // },

          line: {
            color: "black",
          },
        },
      },
      ...tickS,
    ];
    // const longd = extent(locs,d=>d?.long) // [-180,180]
    // const latd = extent(locs,d=>d?.lat)// [-90,90]
    // const center = {lon: (longd[1]-longd[0])/2,lat: (lat[1]-lat[0])/2};
    // const scale = Math.min(180/Math.abs(longd[1]-center.lon),90/Math.abs(latd[1]-center.lat));
    // console.log(180/Math.abs(longd[1]-center.lon),90/Math.abs(latd[1]-center.lat))
    // setDomain({scale,center})
    if (highlight) {
      const _highlight = locs.find(
        (d) => d["Location_RG_ID"] === highlight.Location_RG_ID
      );
      if (_highlight) {
        data.push({
          geo: "geo3",
          type: "scattergeo",
          mode: "markers",
          // locationmode: 'world',
          lon: [_highlight.long],
          lat: [_highlight.lat],
          hoverinfo: "text",
          text: [_highlight.Location_RG_Country],
          showlegend: true,
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
  }, [locs, highlight]);

  let layout = {
    paper_bgcolor: theme.palette.background.paper,
    plot_bgcolor: theme.palette.background.paper,
    autoscale: false,
    height: height,
    width: width,
    margin: { t: 10, r: 10, l: 10, b: 10 },
    geo3: {
      // scope: highlight?highlight.Location_RG_Country.toLowerCase():'world',
      // 'resolution': 50,
      showsubunits: true,
      subunitwidth: 1,
      countrywidth: 1,
      bgcolor: "rgba(0,0,0,0)",
      showland: true,
      showcountries: true,
      landcolor: theme.palette.primary.main, //'rgb(217, 217, 217)',
      showframe: false,
      // projection:{
      //     type: 'hill'
      // },
      // center:domain.center,
      // projection:{
      //     scale:domain.scale,
      // },
      fitbounds: "geojson",
      // lataxis:{
      //     domain:domain.lat
      // }
      // 'resolution': 50
    },
    // grid: {rows: 2, columns: 1, pattern: 'independent'},
    font: {
      family: theme.typography.fontFamily,
      size: theme.typography.fontSize,
      color: theme.palette.text.primary,
    },
    legend: {
      title: { text: "#Sreams" },
      // ticksuffix: '%',
      showticksuffix: "last",
      x: 1,
      xanchor: "right",
      y: 0,
      orientation: "h",
    },
  };
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
      }}
      divId={"Map"}
    />
  );
}
