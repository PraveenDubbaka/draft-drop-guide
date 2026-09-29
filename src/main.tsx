import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";

window.addEventListener("error", (e) => console.error("[window.error]", e.error ?? e.message));
window.addEventListener("unhandledrejection", (e) => console.error("[unhandledrejection]", e.reason));

createRoot(document.getElementById("root")!).render(
 <React.StrictMode>
 <AppErrorBoundary>
 <App />
 </AppErrorBoundary>
 </React.StrictMode>
);
