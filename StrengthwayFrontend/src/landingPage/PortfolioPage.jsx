import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/theme";
import { getPublicPortfolio } from "@/lib/portfolioService";
import { resolveMediaUrl } from "@/lib/portfolioMedia";

import { Navbar } from "@/landingPage/Navbar";
import { Footer } from "@/landingPage/Footer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Site Sections - Portfolio
import { PortfolioHeroSection } from "@/landingPage/portfolio/PortfolioHeroSection";
import { SessionsSection } from "@/landingPage/portfolio/SessionsSection";
import { FeedbackSection } from "@/landingPage/portfolio/FeedbackSection";
import { PhotosSection } from "@/landingPage/portfolio/PhotosSection";
import { VideosSection } from "@/landingPage/portfolio/VideosSection";

export function PortfolioPage() {
  useDocumentTitle("The Strength Way");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [portfolioData, setPortfolioData] = useState({
    sessions: [],
    sessionClips: [],
    feedbackQuotes: [],
    feedbackVideos: [],
    photos: [],
    videos: [],
  });

  useEffect(() => {
    let isMounted = true;
    async function loadPortfolio() {
      try {
        const res = await getPublicPortfolio();
        const data = res?.data || res || {};
        if (isMounted && data) {
          setPortfolioData({
            sessions: Array.isArray(data.sessions) ? data.sessions : [],
            sessionClips: Array.isArray(data.sessionClips) ? data.sessionClips : [],
            feedbackQuotes: Array.isArray(data.feedbackQuotes) ? data.feedbackQuotes : [],
            feedbackVideos: Array.isArray(data.feedbackVideos) ? data.feedbackVideos : [],
            photos: Array.isArray(data.photos) ? data.photos : [],
            videos: Array.isArray(data.videos) ? data.videos : [],
          });
        }
      } catch (err) {
        console.error("Failed to load portfolio dynamic content:", err);
      }
    }

    loadPortfolio();
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
          dataSessions={portfolioData.sessions}
          dataClips={portfolioData.sessionClips}
        />
        <FeedbackSection
          dataQuotes={portfolioData.feedbackQuotes}
          dataVideos={portfolioData.feedbackVideos}
        />
        <PhotosSection
          dataPhotos={portfolioData.photos}
          onSelectPhoto={setSelectedPhoto}
        />
        <VideosSection dataVideos={portfolioData.videos} />
      </main>
      <Footer />

      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl overflow-hidden border-none bg-black/90 p-2 sm:p-4 text-white">
          <DialogTitle className="sr-only">
            {selectedPhoto?.alt || selectedPhoto?.title || "Photo Preview"}
          </DialogTitle>
          {selectedPhoto && (
            <div className="relative flex flex-col items-center">
              <img
                src={resolveMediaUrl(selectedPhoto.src || selectedPhoto.mediaUrl)}
                alt={selectedPhoto.alt || selectedPhoto.title || "Photo Preview"}
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
