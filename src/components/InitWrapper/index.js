"use client";

import useStore from "@/store/strore";
import { useCallback, useEffect } from "react";

export default function InitWrapper({ children }) {
  const { fetchData } = useStore();

  const fetchEvents = useCallback(() => fetchData(), [fetchData]);
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  return <>{children}</>;
}
