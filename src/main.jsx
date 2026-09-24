/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/Toast";
import { ThemeProvider } from "@/hooks/theme";
import { ErrorBoundary } from "@/components/ui/NotFoundPage";
import App from "./App";
import "./index.css";
import gymLogo from "@/assets/gym_logo.png";

// Enforce gym logo as favicon
if (typeof document !== "undefined") {
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = gymLogo;
}

// React Router doesn't reset scroll position between route changes on its
// own — without this, navigating to a new page keeps whatever scroll offset
// the previous page was left at.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Explicit "instant" — the two-arg scrollTo(0, 0) form passes behavior:
    // "auto", which defers to the site-wide `scroll-behavior: smooth` CSS
    // and animates the reset instead of snapping to it.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <ScrollToTop />
          <App />
          <Toaster />
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
