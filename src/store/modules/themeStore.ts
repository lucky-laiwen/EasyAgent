import { createSlice } from "@reduxjs/toolkit";
interface Theme {
  theme: "light" | "dark";
}
const initialState: Theme = {
  theme: window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light",
};

const themeStore = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = themeStore.actions;

export default themeStore.reducer;
