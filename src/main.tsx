import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "@/router";
import "./index.css";
import "@ant-design/v5-patch-for-react-19";
import { Provider } from "react-redux";
import store from "./store";
createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <RouterProvider router={router}></RouterProvider>
  </Provider>
);
