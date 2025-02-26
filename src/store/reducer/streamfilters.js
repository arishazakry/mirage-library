"use client";
import { createSlice } from "@reduxjs/toolkit";

const initialState = { value: {}, orderList: [""], hasEmpty: true };
// orderList can has ''
// value is map of filter
// hasEmpty is true if '' is in orderList
const streamFilters = createSlice({
  name: "streamFilters",
  initialState,
  reducers: {
    deleteFilter: (state, action) => {
      state.orderList = state.orderList.filter((d) => d !== action.payload.key);
      delete state.value[action.payload.key];
    },
    setFilter: (state, action) => {
      let oindex = state.orderList.indexOf(action.payload.key);
      if (action.payload.key !== "") {
        // check if filter existed in list
        if (oindex != -1) {
          state.value[action.payload.key] = action.payload.value;
        } else {
          // check if need to replace
          let preindex = state.orderList.indexOf(action.payload.prekey);
          if (preindex != -1) {
            state.orderList[preindex] = action.payload.key;
            if (action.payload.prekey !== "")
              // state.value[action.payload.prekey] = []; // remove oldfilter
              delete state.value[action.payload.prekey];
          } else {
            state.orderList.push(action.payload.key);
          }
        }
        state.value[action.payload.key] = action.payload.value;
      } else {
        if (oindex == -1) {
          state.orderList.push(action.payload.key);
        }
      }
      state.hasEmpty = state.orderList.indexOf("") !== -1;
    },
    setFilters: (state, action) => {
      state.value = { ...action.payload.value };
      state.orderList = Object.keys(action.payload.value);
      state.hasEmpty = state.orderList.indexOf("") !== -1;
    },
  },
});
export const { deleteFilter, setFilter, setFilters } = streamFilters.actions;
export const selectFilters = (state) => state.streamFilters.present.value;
export const selectFiltersList = (state) =>
  state.streamFilters.present.orderList;
export const selectHasEmpty = (state) => state.streamFilters.present.hasEmpty;
export default streamFilters.reducer;
