import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/login";
import Home from "@/pages/layout";
const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <Home />,
  },
]);

export default router;
