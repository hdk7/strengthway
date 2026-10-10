import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/theme";

import { Navbar } from "@/landingPage/Navbar";
import { Footer } from "@/landingPage/Footer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getPublicPortfolio } from "@/lib/portfolioService";

// Site Sections - Portfolio
import { PortfolioHeroSection } from "@/landingPage/portfolio/PortfolioHeroSection";
import { SessionsSection } from "@/landingPage/portfolio/SessionsSection";
import { FeedbackSection } from "@/landingPage/portfolio/FeedbackSection";
import { PhotosSection } from "@/landingPage/portfolio/PhotosSection";
import { VideosSection } from "@/landingPage/portfolio/VideosSection";

export function PortfolioPage() {
  useDocumentTitle("The Strength Way");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getPublicPortfolio()
      .then((data) => {
        if (isMounted && data) {
          setPortfolioData(data);
        }
      })
      .catch((err) => {
        console.warn("Public portfolio fetch failed, using default assets:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background w-full max-w-full overflow-x-clip">
      <Navbar />
      <main className="pt-16 w-full max-w-full overflow-x-clip flex-1">
        <PortfolioHeroSection />
        <SessionsSection
          disciplines={portfolioData?.sessionDisciplines}
          sessionClips={portfolioData?.sessionClips}
        />
        <FeedbackSection feedbackStories={portfolioData?.feedbackStories} />
        <PhotosSection
          photos={portfolioData?.photos}
          onSelectPhoto={setSelectedPhoto}
        />
        <VideosSection videos={portfolioData?.movementVideos} />
      </main>
      <Footer />

      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl overflow-hidden border-none bg-black/90 p-2 sm:p-4 text-white">
          <DialogTitle className="sr-only">{selectedPhoto?.alt || "Photo Preview"}</DialogTitle>
          {selectedPhoto && (
            <div className="relative flex flex-col items-center">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.alt}
                className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PortfolioPage;
