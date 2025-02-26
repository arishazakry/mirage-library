"use client";
import { useTranslations } from "next-intl";
import { DockviewReact } from "dockview";
import EarthView from "@/app/@widgets/earth/page";
import { useEffect, useRef, useState } from "react";
import { defaultConfig } from "./defaultConfig";
import { RightControls } from "./control";
import EventList from "@/app/@widgets/event/page";
import EventDetailWrapper from "../EventDetailWrapper";
import ListenCardWrapper from "../ListenCard/wrapper";
import EventSelectedList from "@/app/@widgets/selected/page";
import EventMap from "@/app/@widgets/eventmap/page";

export default function DynamicLayout() {
  const t = useTranslations("Dashboard");
  const dockviewRef = useRef(null);
  const [widgets, setWidgets] = useState(["earth", "earth"]);
  const [panels, setPanels] = useState([]);
  const [api, setApi] = useState();

  const onReady = (event) => {
    setApi(event.api);
  };

  useEffect(() => {
    if (!api) {
      return;
    }

    const disposables = [
      api.onDidAddPanel((event) => {
        setPanels((_) => [..._, event.id]);
      }),
      api.onDidRemovePanel((event) => {
        setPanels((_) => {
          const next = [..._];
          next.splice(
            next.findIndex((x) => x === event.id),
            1
          );

          return next;
        });
      }),
    ];

    const loadLayout = () => {
      const state = localStorage.getItem("dv-demo-state");

      if (state) {
        try {
          api.fromJSON(JSON.parse(state));
          return;
        } catch {
          localStorage.removeItem("dv-demo-state");
        }
        return;
      }

      defaultConfig(api, t);
    };

    loadLayout();

    return () => {
      disposables.forEach((disposable) => disposable.dispose());
    };
  }, [api, t]);

  return (
    <div className="w-full h-full">
      <DockviewReact
        onReady={onReady}
        // ref={dockviewRef}
        className="w-full h-full"
        components={{
          default: EarthView,
          earth: EarthView,
          event_list: EventList,
          event_selected_list: EventSelectedList,
          event_detail: EventDetailWrapper,
          media_detail: ListenCardWrapper,
          event_map: EventMap,
        }}
        rightHeaderActionsComponent={RightControls}
      ></DockviewReact>
    </div>
  );
}
