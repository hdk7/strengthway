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

// ── One-time migration: clear stale business-data localStorage keys ────────────
// The app previously stored all business data in localStorage. Now that the
// backend is the single source of truth, we remove those stale keys once so
// they don't shadow fresh API responses.
(function purgeStaleLocalStorageKeys() {
  const MIGRATION_FLAG = "tsw-api-migration-v1";
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return; // already done

    const staleKeys = [
      "tsw-batches",
      "tsw-coach-shifts",
      "tsw-scheduled-classes",
      "tsw-registered-members",
      "tsw-members",
      "tsw-trainers",
      "tsw-master-class-schedules",
      "tsw-master-class-items",
      "tsw-generated-sessions",
      "tsw-holidays",
      "tsw-curriculum-version",
      "tsw-plans",
      "tsw-inquiries",
      "thestrengthway_membership_plans_v1",
      "thestrengthway_inquiries_data_v1",
      "thestrengthway_batches_v1",
      "thestrengthway_members_v1",
      "thestrengthway_trainers_v1",
      "thestrengthway_master_schedules_v1",
      "thestrengthway_attendance_holidays_v1",
    ];

    staleKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(MIGRATION_FLAG, "1");

    console.info("[Strengthway] Stale localStorage keys purged — API migration complete.");
  } catch {
    // Ignore errors in restricted/private-browsing environments
  }
})();


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
