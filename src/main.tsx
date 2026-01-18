import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "@/router";
import "animate.css";
import "./index.css";
import GlobalLoading from "@/components/EALoading";
import { MessageProvider } from "./components/EAMessage";
createRoot(document.getElementById("root")!).render(
  <MessageProvider>
    <RouterProvider router={router} />
    <GlobalLoading />
  </MessageProvider>
);
