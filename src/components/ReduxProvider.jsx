"use client";

import { Provider } from "react-redux";
import mcApp from "@/store/reducer";

export default function ReduxProvider({ children }) {
  return <Provider store={mcApp}>{children}</Provider>;
}
