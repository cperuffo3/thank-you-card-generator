import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { syncWithLocalTheme } from "./actions/theme";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./utils/routes";
import { SessionProvider } from "./context/session-context";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  useEffect(() => {
    syncWithLocalTheme();
  }, []);

  return (
    <SessionProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" />
    </SessionProvider>
  );
}

const root = createRoot(document.getElementById("app")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
