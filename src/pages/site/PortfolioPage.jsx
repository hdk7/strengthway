import { useState } from "react";
import { useDocumentTitle } from "@/hooks/theme";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PortfolioHeroSection } from "@/components/site/portfolio/PortfolioHeroSection";
import { PhotosSection } from "@/components/site/portfolio/PhotosSection";
import { VideosSection } from "@/components/site/portfolio/VideosSection";
import { SessionsSection } from "@/components/site/portfolio/SessionsSection";
import { FeedbackSection } from "@/components/site/portfolio/FeedbackSection";

import { openMemberRegistrationModal } from "@/components/site/MemberRegistration";

export default function PortfolioPage() {
  useDocumentTitle("Portfolio — The Strength Way");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handleJoin = () => {
    openMemberRegistrationModal();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <PortfolioHeroSection onJoin={handleJoin} />
        <PhotosSection onSelectPhoto={setSelectedPhoto} />
        <VideosSection />
        <SessionsSection onJoin={handleJoin} />
        <FeedbackSection />
      </main>
      <Footer />

      {/* Lightbox Modal */}
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
