import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const IGNORED_ERROR_MESSAGES = [
  "This script should only be loaded in a browser extension",
  "content-youtube-embed",
];

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const message = event.error?.message || event.message || "";

    if (IGNORED_ERROR_MESSAGES.some((text) => message.includes(text))) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");

    if (IGNORED_ERROR_MESSAGES.some((text) => reason.includes(text))) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
