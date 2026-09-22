import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/theme";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { CustomCursor } from "@/components/site/CustomCursor";
import { BackToTop } from "@/components/site/BackToTop";
import { HeroSection } from "@/components/site/home/HeroSection";
import { AboutSection } from "@/components/site/home/AboutSection";
import { ProgramsSection } from "@/components/site/home/ProgramsSection";
import { PlansSection } from "@/components/site/home/PlansSection";
import { TrainersSection } from "@/components/site/home/TrainersSection";
import { PortfolioPreviewSection } from "@/components/site/home/PortfolioPreviewSection";
import { BmiSection } from "@/components/site/home/BmiSection";
import { ContactSection } from "@/components/site/home/ContactSection";

export default function HomePage() {
  useDocumentTitle("The Strength Way");
  const location = useLocation();

  // Scoped to this route only — other pages (admin/trainer dashboards) keep
  // their normal scrollbar.
  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar");
    return () => document.documentElement.classList.remove("no-scrollbar");
  }, []);

  // Smooth scroll to anchor section if navigated with a hash (e.g. /#trainers)
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const scrollToSection = () => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
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
    }
  }, [location.hash]);

  return (
    <div className="custom-cursor-scope min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
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
