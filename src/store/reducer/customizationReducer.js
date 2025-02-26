"use client"; // Đảm bảo file này chỉ chạy trên client

import * as actionTypes from "./actions/setting";

const persistKey = "theme";
const fontSizeKey = `${persistKey}:fontSize`;

// ✅ Không truy cập localStorage khi import
export const initialState = {
  isOpen: [],
  fontSize: 1, // Giá trị mặc định
  opened: true,
};

const customizationReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_FONT_SIZE:
      if (typeof window !== "undefined") {
        // localStorage.setItem(fontSizeKey, action.fontSize);
      }
      return {
        ...state,
        fontSize: action.fontSize,
      };
    case actionTypes.INCREASE_FONT_SIZE:
      if (typeof window !== "undefined") {
        const newFontSize = state.fontSize + 0.1;
        // localStorage.setItem(fontSizeKey, newFontSize);
        return { ...state, fontSize: newFontSize };
      }
      return state;
    case actionTypes.DECREASE_FONT_SIZE:
      if (typeof window !== "undefined") {
        const newFontSize = Math.max(0.5, state.fontSize - 0.1);
        // localStorage.setItem(fontSizeKey, newFontSize);
        return { ...state, fontSize: newFontSize };
      }
      return state;
    default:
      return state;
  }
};

export default customizationReducer;
