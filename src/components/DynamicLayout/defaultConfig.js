export function defaultConfig(api, t) {
  const panel1 = api.addPanel({
    id: "panel_earth",
    component: "earth",
    renderer: "always",
    title: t("earth_view"),
    isCollapsible: true,
  });

  const panel6 = api.addPanel({
    id: "panel_event_detail",
    component: "event_detail",
    title: t("event_detail"),
    position: { referencePanel: panel1, direction: "right" },
  });

  const panel7 = api.addPanel({
    id: "panel_listen",
    component: "default",
    title: t("listen"),
    position: { referencePanel: panel6 },
  });

  api.addPanel({
    id: "panel_list_map",
    component: "default",
    title: t("list_map"),
    position: { referencePanel: panel6 },
  });

  api.addPanel({
    id: "panel_list_viz",
    component: "default",
    title: t("list_viz"),
    position: { referencePanel: panel6 },
  });

  const panel4 = api.addPanel({
    id: "panel_event_list",
    component: "event_list",
    title: t("event_list"),
    position: { referencePanel: panel6, direction: "above" },
  });

  const panel5 = api.addPanel({
    id: "panel_event_selected",
    component: "default",
    title: t("event_selected"),
    position: { referencePanel: panel4, direction: "right" },
  });
  panel1.api.setActive();
  panel1.api.setSize({
    width: window.innerWidth / 3,
  });
}
