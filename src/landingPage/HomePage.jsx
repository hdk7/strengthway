import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/theme";

import { Navbar } from "@/landingPage/Navbar";
import { Footer } from "@/landingPage/Footer";
import { CustomCursor } from "@/landingPage/CustomCursor";
import { BackToTop } from "@/landingPage/BackToTop";

// Site Sections - Home
import { HeroSection } from "@/landingPage/home/HeroSection";
import { AboutSection } from "@/landingPage/home/AboutSection";
import { ProgramsSection } from "@/landingPage/home/ProgramsSection";
import { PlansSection } from "@/landingPage/home/PlansSection";
import { TrainersSection } from "@/landingPage/home/TrainersSection";
import { PortfolioPreviewSection } from "@/landingPage/home/PortfolioPreviewSection";
import { BmiSection } from "@/landingPage/home/BmiSection";
import { ContactSection } from "@/landingPage/home/InquirieSection";

export function HomePage() {
  useDocumentTitle("The Strength Way");
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar");
    document.body.classList.add("no-scrollbar");
    return () => {
      document.documentElement.classList.remove("no-scrollbar");
      document.body.classList.remove("no-scrollbar");
    };
  }, []);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      if (targetId === "hero" || targetId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const scrollToSection = () => {
        const el = document.getElementById(targetId);
        if (el) {
          const elementPosition = el.getBoundingClientRect().top;
          const currentScroll =
            window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          // Offset by 70px to account for the fixed navbar
          const offsetPosition = elementPosition + currentScroll - 70;
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth",
          });
          return true;
        }
        return false;
      };

      if (!scrollToSection()) {
        const timer1 = setTimeout(scrollToSection, 120);
        const timer2 = setTimeout(scrollToSection, 300);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    } else {
      // Ensure landing page starts cleanly at the top hero section
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location.hash, location.pathname]);

  return (
    <div className="custom-cursor-scope min-h-screen min-h-[100dvh] flex flex-col bg-background w-full max-w-full overflow-x-clip no-scrollbar">
      <Navbar />
      <main className="pt-16 w-full max-w-full overflow-x-clip flex-1 no-scrollbar">
        <HeroSection />
        <AboutSection />
        <ProgramsSection />
        <PlansSection />
        <TrainersSection />
        <PortfolioPreviewSection />
        <BmiSection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
      <CustomCursor />
    </div>
  );
}

export default HomePage;
