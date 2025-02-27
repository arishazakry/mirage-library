"use client";
import React, { useCallback, useEffect, useState } from "react";
import useStore from "@/store/strore"; // Zustand store
import EventMap from "@/components/EventMap";

export default function EventMapWraper() {
  const {
    detail,
    locs,
    events,
    loading: { events: loadingEvents },
  } = useStore();
  return <EventMap currentDetail={detail} events={events} locs={locs} />;
}
