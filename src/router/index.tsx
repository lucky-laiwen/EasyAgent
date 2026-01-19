import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/login";
import Home from "@/pages/layout";
const router = createBrowserRouter([
  {
    path: "/EasyAgent/login",
    element: <Login />,
  },
  {
    path: "/EasyAgent/",
    element: <Home />,
  },
]);

export default router;
