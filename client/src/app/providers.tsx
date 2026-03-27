import { RouterProvider } from "react-router-dom";
import { router } from "./router.js";

export function Providers() {
  return <RouterProvider router={router} />;
}
