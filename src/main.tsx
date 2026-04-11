import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  document.body.innerHTML = '<div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:system-ui;color:#666">Failed to initialize app - root element not found</div>';
} else {
  try {
    createRoot(container).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Failed to render app:", error);
    container.innerHTML = `<div style="display:flex;height:100vh;align-items:center;justify-content:center;font-family:system-ui;color:#d32f2f;flex-direction:column;gap:1rem;padding:1rem;text-align:center"><h1 style="margin:0;font-size:1.5rem">Application Error</h1><p style="margin:0;color:#666">Check browser console for details</p></div>`;
  }
}
