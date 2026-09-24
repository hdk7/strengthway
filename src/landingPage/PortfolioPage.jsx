import { useState } from "react";
import { useDocumentTitle } from "@/hooks/theme";

import { Navbar } from "@/landingPage/Navbar";
import { Footer } from "@/landingPage/Footer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Site Sections - Portfolio
import { PortfolioHeroSection } from "@/landingPage/portfolio/PortfolioHeroSection";
import { PhotosSection } from "@/landingPage/portfolio/PhotosSection";
import { VideosSection } from "@/landingPage/portfolio/VideosSection";
import { SessionsSection } from "@/landingPage/portfolio/SessionsSection";
import { FeedbackSection } from "@/landingPage/portfolio/FeedbackSection";

export function PortfolioPage() {
  useDocumentTitle("Portfolio — The Strength Way");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background w-full max-w-full overflow-x-clip">
      <Navbar />
      <main className="pt-16 w-full max-w-full overflow-x-clip flex-1">
        <PortfolioHeroSection />
        <PhotosSection onSelectPhoto={setSelectedPhoto} />
        <VideosSection />
        <SessionsSection />
        <FeedbackSection />
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
