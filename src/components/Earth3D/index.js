"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
  forwardRef,
} from "react";
import * as d3 from "d3";
import "./index.css";
import exportAsImage from "./htm2image";
import { Save, Plus, Minus } from "lucide-react";
import { useTheme } from "next-themes";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
const earthNight = "/assets/earth-night.jpg";
const earthDay = "/assets/earth-blue-marble.jpg";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export const TOP = 20;
export const colorArr = [
  "#1f77b4",
  "#aec7e8",
  "#ff7f0e",
  "#ffbb78",
  "#2ca02c",
  "#98df8a",
  "#d62728",
  "#ff9896",
  "#9467bd",
  "#c5b0d5",
  "#8c564b",
  "#c49c94",
  "#e377c2",
  "#f7b6d2",
  "#7f7f7f",
  "#c7c7c7",
  "#bcbd22",
  "#dbdb8d",
  "#17becf",
  "#9edae5",
];

const arcThickScale = d3.scaleLinear().range([0.01, 0.7]);
const labelScale = d3.scaleLinear().range([0.3, 0.4]);
const countriesScale = d3.scaleLinear().range([0.1, 1]);

const Earth3D = forwardRef(
  (
    {
      locs,
      countries,
      width,
      height,
      onSelect = () => {},
      onSelectLegend = () => {},
      getSwitchView,
      zoomLoc,
      toolbarRef,
    },
    ref
  ) => {
    const globeEl = useRef();
    const holderRef = useRef();
    const [colorKey, setColorKey] = useState("location_rg_country");
    const [selectPoint, setSelectPoint] = useState();
    const [currentSequnce, setCurrentSequnce] = useState(0);
    const [MAP_CENTERs, setMAP_CENTERs] = useState([
      { lat: -92.52824601944323, lng: 38.31079101844495, altitude: 1.8 },
      { lat: 51.58421865, lng: 45.9571029, altitude: 1.8 },
      { lat: 31.3037101, lng: -89.29276214, altitude: 1.8 },
      { lat: 33.5842591, lng: -101.8804709, altitude: 1.8 },
    ]);
    const [ringData, setRingData] = useState([]);
    const [contriesMap, setcontriesMap] = useState({});
    const { theme } = useTheme();
    const colorsCategory = useMemo(() => {
      return (function (otherColor = "#ececec") {
        const scale = d3.scaleOrdinal(colorArr);
        let master = (val) => {
          if (!val || val === "" || val.trim === "") return "black";
          const domain = scale.domain();
          if (domain.find((d) => d === val) || domain.length < TOP)
            return scale(val);
          else return otherColor;
        };
        master.domain = scale.domain;
        master.range = scale.range;
        return master;
      })();
    }, []);

    function handleData({ locs, countries }) {
      const contriesMap = {};
      const range = d3.extent(locs, (d) => d?.count);

      arcThickScale.domain(range);
      labelScale.domain(range);

      countriesScale.domain(
        d3.extent(countries, (d) => {
          contriesMap[d.title] = d;
          return d?.count;
        })
      );

      //color
      colorsCategory.domain([]).range(colorArr);
      countries.forEach((d) => colorsCategory(d.title));

      let order = 0;
      if (countries.length > 3)
        [0, 1, 2, 3, 0].forEach((i) => {
          if (!MAP_CENTERs[order])
            MAP_CENTERs[order] = { lat: 0, lng: 0, altitude: 1 };
          MAP_CENTERs[order].lat = countries[i].lat;
          MAP_CENTERs[order].lng = countries[i].long;
          order++;
        });

      return { MAP_CENTERs, contriesMap };
    }
    useEffect(() => {
      const { MAP_CENTERs, contriesMap } = handleData({ locs, countries });
      setcontriesMap(contriesMap);
      setMAP_CENTERs(MAP_CENTERs);
      if (!zoomLoc) setCurrentSequnce(0);
    }, [locs, countries]);

    const [timer, setTimer] = useState(null);
    useEffect(() => {
      if (globeEl.current) {
        if (currentSequnce < MAP_CENTERs.length) {
          const interval = setTimeout(() => {
            globeEl.current.pointOfView(MAP_CENTERs[currentSequnce], 4000);
            setCurrentSequnce(currentSequnce + 1);
          }, 4000);
          setTimer(interval);
          return () => {
            clearInterval(interval);
          };
        }
      }
    }, [currentSequnce, MAP_CENTERs]);
    const stopPlay = useCallback(() => {
      if (timer) clearInterval(timer);
      setCurrentSequnce(MAP_CENTERs.length);
    }, [timer]);

    const [timerRing, setTimerRing] = useState(null);
    const zoomTo = useCallback(
      (lng, lat) => {
        if (globeEl.current) {
          stopPlay();
          globeEl.current.pointOfView({ lat, lng, altitude: 2 }, 2000);
          setRingData([{ lng, lat }]);
          if (timerRing) clearInterval(timerRing);
          let interval = setTimeout(() => {
            setRingData([]);
          }, 10000);
          setTimerRing(interval);
        }
      },
      [currentSequnce, stopPlay, timerRing]
    );
    useEffect(() => {
      if (zoomLoc) zoomTo(zoomLoc.lng, zoomLoc.lat);
      return () => {
        if (timerRing) clearInterval(timerRing);
      };
    }, [zoomLoc]);

    const onSaveImage = useCallback(() => {
      exportAsImage(globeEl.current, "MIRAGE-mc");
    }, [holderRef, globeEl]);

    useEffect(() => {
      onSelectLegend("selectCountry", (d) => {
        onSelect({ location_rg_country: [d["title"]] });
        zoomTo(d.long, d.lat);
      });
    }, [zoomTo, onSelect]);

    const zoomIn = useCallback(() => {
      if (globeEl.current) {
        const loc = { ...globeEl.current.pointOfView() };
        loc.altitude = loc.altitude / 2;
        globeEl.current.pointOfView(loc, 2000);
      }
    }, [globeEl]);
    const zoomOut = useCallback(() => {
      if (globeEl.current) {
        const loc = { ...globeEl.current.pointOfView() };
        loc.altitude = loc.altitude * 2;
        globeEl.current.pointOfView(loc, 2000);
      }
    }, [globeEl]);

    return (
      <div
        style={{
          background: "#ffffff",
          position: "relative",
        }}
      >
        <div ref={holderRef}>
          <Globe
            width={width}
            height={height}
            ref={globeEl}
            globeImageUrl={theme === "dark" ? earthNight : earthDay}
            backgroundColor={theme === "dark" ? "black" : "#7ec7f6"}
            showAtmosphere={true}
            ringsData={ringData}
            ringColor={() => "#D39F49"}
            ringResolution={1000}
            ringMaxRadius={5}
            ringPropagationSpeed={5}
            ringRepeatPeriod={500}
            labelsData={countries}
            labelLat={useCallback((d) => d.lat, [])}
            labelLng={useCallback((d) => d.long, [])}
            labelAltitude={useCallback(
              (d) =>
                selectPoint && selectPoint["location_rg_country"] === d["title"]
                  ? 0.05
                  : 0.02,
              [selectPoint]
            )}
            labelText={useCallback((d) => d["title"], [])}
            // labelSize={d => (selectPoint&&(selectPoint===d))?0.8:arcThickScale(d?.count)/3}
            labelSize={useCallback(
              (d) =>
                selectPoint && selectPoint["location_rg_country"] === d["title"]
                  ? 1
                  : labelScale(d?.count),
              [selectPoint]
            )}
            // labelSize={useCallback(d => labelScale(arcThickScale(d?.count)),[])}
            labelDotRadius={0}
            // labelColor={useCallback(d => (selectPoint&&(selectPoint['location_rg_country']===d['title']))?('#dd6700'):(d.color??'white'),[selectPoint])}
            labelColor={useCallback((d) => d.color ?? "white", [selectPoint])}
            labelResolution={2}
            hexBinPointsData={locs}
            hexBinPointWeight="count"
            hexBinPointLng={useCallback((d) => d.long, [])}
            hexBinPointLat={useCallback((d) => d.lat, [])}
            hexAltitude={useCallback((d) => arcThickScale(d.sumWeight), [])}
            hexBinResolution={4}
            hexTopColor={useCallback(
              (d) => colorsCategory(d.points[0][colorKey]),
              []
            )}
            hexSideColor={useCallback(
              (d) => colorsCategory(d.points[0][colorKey]),
              []
            )}
            hexBinMerge={false}
            onHexHover={useCallback((hex) => {
              if (hex) {
                setSelectPoint(hex.points[0]);
              } else setSelectPoint(undefined);
            }, [])}
            hexLabel={useCallback((d) => {
              return `<div class="overlay-holder">
            <div class="overlay-header">
                <span><b>${d3.sum(
                  d.points,
                  (s) => s?.count
                )}</b> stations</span>
            </div>
            <div class="overlay-content">
            <table>
                <tbody><tr>${d.points
                  .slice()
                  .sort((a, b) => b?.count - a?.count)
                  .map((d) => `<td>[${d?.count}]</td><td>${d.title}</td>`)
                  .join("</tr><tr>")}</tr></tbody>
            </table>
            </div>
          </div>`;
            }, [])}
            onHexClick={(d) => {
              const location_rg_city = [];
              d.points.forEach((d) => {
                location_rg_city.push(d.location_rg_city);
              });
              onSelect({
                location_rg_city,
                location_rg_country: [d.points[0]?.location_rg_country],
              });
            }}
            onGlobeClick={stopPlay}
          />
        </div>
        <div
          className={"flex flex-col absolute right-0 top-0 m-1"}
          direction={"row"}
        >
          {getSwitchView && (
            <div>
              <Toggle
                defaultPressed="check"
                pressed={getSwitchView()}
                onPressedChange={() => {
                  const current = getSwitchView();
                  getSwitchView(!current);
                }}
              >
                {getSwitchView() ? "All Data" : "Reviewed Data"}
              </Toggle>
            </div>
          )}
          <div className={"flex flex-col gap-1"} aria-label="map tool">
            <Button onClick={onSaveImage}>
              <Save />
            </Button>
            <Button onClick={zoomIn}>
              <Plus />
            </Button>
            <Button onClick={zoomOut}>
              <Minus />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
Earth3D.displayName = "Earth3D";
export default Earth3D;
