import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import { logger } from "./lib/logger";

logger.info("app starting", { version: import.meta.env.VITE_APP_VERSION ?? "dev" }, "main");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
