"use client";
import undoable from "redux-undo";
import { configureStore } from "@reduxjs/toolkit";
import streamFilters from "./streamfilters";
import customizationReducer from "./customizationReducer";
import seletedListReducer from "./seletedListReducer";

const mcApp = configureStore({
  reducer: {
    streamFilters: undoable(streamFilters),
    customization: customizationReducer,
    seletedList: seletedListReducer,
  },
});

export default mcApp;
