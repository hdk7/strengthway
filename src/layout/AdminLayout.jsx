import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useDocumentTitle } from "@/hooks/theme";

function getScreenTier() {
  if (typeof window === "undefined") return "large";
  const w = window.innerWidth;
  if (w < 768) return "small";
  if (w < 1280) return "medium";
  return "large";
}

export default function AdminLayout() {
  useDocumentTitle("The Strength Way — Admin");
  const [tier, setTier] = useState(getScreenTier);
  const [collapsed, setCollapsed] = useState(() => getScreenTier() === "medium");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let lastTier = getScreenTier();
    const handleResize = () => {
      const currentTier = getScreenTier();
      if (currentTier !== lastTier) {
        if (currentTier === "large") {
          setCollapsed(false);
          setMobileOpen(false);
        } else if (currentTier === "medium") {
          setCollapsed(true);
          setMobileOpen(false);
        } else {
          setMobileOpen(false);
        }
        lastTier = currentTier;
        setTier(currentTier);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggle = () => {
    if (tier === "small") {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  };

  const sidebarVisible = tier === "small" ? mobileOpen : !collapsed;
  const isCollapsed = tier === "small" ? false : collapsed;

  const contentLeftClass =
    tier === "small" ? "left-3" : isCollapsed ? "left-[96px]" : "left-[280px]";

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Fixed floating header */}
      <div className="fixed top-3 left-3 right-3 z-40">
        <Header onToggle={handleToggle} sidebarVisible={sidebarVisible} />
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isMobile={tier === "small"}
      />

      {/* Scrollable main content */}
      <main
        className={`fixed top-21 bottom-3 right-3 ${contentLeftClass} transition-[left] duration-200 ease-in-out overflow-y-auto rounded-xl bg-background`}
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
