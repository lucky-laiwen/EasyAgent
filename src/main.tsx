import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "@/router";
import "animate.css";
import "./index.css";
import "@ant-design/v5-patch-for-react-19";
import GlobalLoading from "@/components/EALoading";

createRoot(document.getElementById("root")!).render(
  <>
    <RouterProvider router={router} />
    <GlobalLoading />
  </>
);
