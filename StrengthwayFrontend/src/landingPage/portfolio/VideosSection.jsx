import { useState, useEffect } from "react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import { getPublicPortfolio } from "@/lib/portfolioService";
import video1 from "@/assets/portfolio-video-1.mp4";
import video2 from "@/assets/portfolio-video-2.mp4";
import video3 from "@/assets/portfolio-video-3.mp4";
import video4 from "@/assets/portfolio-video-4.mp4";
import video5 from "@/assets/portfolio-video-5.mp4";
import video6 from "@/assets/portfolio-video-6.mp4";

const DEFAULT_VIDEOS = [
  { src: video1, title: "Rig conditioning" },
  { src: video5, title: "Animal Flow session" },
  { src: video6, title: "Flowing again after ACL & meniscus recovery" },
  { src: video4, title: "Strength circuit" },
  { src: video2, title: "Movement warm-up" },
  { src: video3, title: "Flow drill" },
];

export function VideosSection({ videos: initialVideos }) {
  const [videosData, setVideosData] = useState(initialVideos || null);

  useEffect(() => {
    if (initialVideos) {
      setVideosData(initialVideos);
    }
  }, [initialVideos]);

  // Standalone fallback fetch
  useEffect(() => {
    if (!initialVideos) {
      getPublicPortfolio()
        .then((res) => {
          if (res?.movementVideos && res.movementVideos.length > 0) {
            setVideosData(res.movementVideos);
          }
        })
        .catch(() => {});
    }
  }, [initialVideos]);

  const displayVideos =
    videosData && videosData.length > 0
      ? videosData.map((v) => ({
          src: v.mediaUrl || v.src,
          title: v.title || "Movement technique",
          poster: v.thumbnailUrl || undefined,
        }))
      : DEFAULT_VIDEOS;

  return (
    <section id="videos" className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Reveal className="min-w-0">
        <SectionHeading
          eyebrow="Videos"
          title={
            <>
              See the <span className="text-gradient">movement</span>.
            </>
          }
        />
      </Reveal>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayVideos.map((v, i) => (
          <Reveal key={`${v.title}-${i}`} delay={(i % 3) * 80} className="min-w-0">
            <SpotlightCard className="overflow-hidden rounded-2xl border border-border bg-card/50">
              <video
                src={v.src}
                poster={v.poster}
                controls
                preload="metadata"
                onPlay={(e) => handleVideoPlay(e.currentTarget)}
                className={`aspect-video w-full bg-black object-cover ${
                  i % 3 === 1 ? "object-center" : "object-top"
                }`}
              />
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

