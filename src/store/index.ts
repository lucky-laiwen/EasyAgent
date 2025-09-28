import userStore from "./modules/userStore";
import { configureStore } from "@reduxjs/toolkit";
import messageStore from "./modules/messageStore";
import themeStore from "./modules/themeStore";
const store = configureStore({
  reducer: {
    user: userStore,
    message: messageStore,
    theme: themeStore,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type dispatch = typeof store.dispatch;

export default store;
