import { useEffect } from "react";
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
import { TestimonialsSection } from "@/components/site/home/TestimonialsSection";
import { SuccessStoriesSection } from "@/components/site/home/SuccessStoriesSection";
import { BmiSection } from "@/components/site/home/BmiSection";
import { ContactSection } from "@/components/site/home/ContactSection";

export default function HomePage() {
  useDocumentTitle("The Strength Way");

  // Scoped to this route only — other pages (admin/trainer dashboards) keep
  // their normal scrollbar.
  useEffect(() => {
    document.documentElement.classList.add("no-scrollbar");
    return () => document.documentElement.classList.remove("no-scrollbar");
  }, []);

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
        <TestimonialsSection />
        <SuccessStoriesSection />
        <BmiSection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
      <CustomCursor />
    </div>
  );
}
