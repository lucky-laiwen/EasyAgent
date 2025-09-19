import userStore from "./modules/userStore";
import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
  reducer: {
    user: userStore,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type dispatch = typeof store.dispatch;

export default store;
