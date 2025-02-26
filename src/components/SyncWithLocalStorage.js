import React, { useEffect } from "react";
import useStore from "./store";

const SyncWithLocalStorage = () => {
  const { setLocs, setCountries, setFields, setEvents } = useStore();

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "app-data") {
        const storedData = JSON.parse(e.newValue);
        if (storedData) {
          setLocs(storedData.locs || []);
          setCountries(storedData.countries || []);
          setFields(storedData.fields || {});
          setEvents(storedData.events || []);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [setLocs, setCountries, setFields, setEvents]);

  return null;
};

export default SyncWithLocalStorage;
