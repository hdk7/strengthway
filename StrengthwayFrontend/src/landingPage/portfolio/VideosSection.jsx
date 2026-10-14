import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import { resolveMediaUrl } from "@/lib/portfolioMedia";

export function VideosSection({ dataVideos = [] }) {
  const videosList = Array.isArray(dataVideos) ? dataVideos : [];

  if (videosList.length === 0) {
    return null;
  }

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
        {videosList.map((v, i) => {
          const videoSrc = resolveMediaUrl(v.mediaUrl || v.src);
          const posterSrc = v.thumbnailUrl ? resolveMediaUrl(v.thumbnailUrl) : undefined;
          const objectPos = v.focusPosition
            ? v.focusPosition === "center" || v.focusPosition === "object-center"
              ? "object-center"
              : v.focusPosition === "bottom" || v.focusPosition === "object-bottom"
              ? "object-bottom"
              : "object-top"
            : i % 3 === 1
            ? "object-center"
            : "object-top";

          return (
            <Reveal key={v.id || v.title || i} delay={(i % 3) * 80} className="min-w-0">
              <SpotlightCard className="overflow-hidden rounded-2xl border border-border bg-card/50">
                <video
                  src={posterSrc ? videoSrc : `${videoSrc}#t=1.2`}
                  poster={posterSrc}
                  controls
                  preload="metadata"
                  onPlay={(e) => {
                    if (e.currentTarget.dataset.rewound !== "true" && e.currentTarget.currentTime <= 1.5) {
                      e.currentTarget.dataset.rewound = "true";
                      e.currentTarget.currentTime = 0;
                      e.currentTarget.play();
                      return;
                    }
                    handleVideoPlay(e.currentTarget);
                  }}
                  className={`aspect-video w-full bg-black object-cover ${objectPos}`}
                />
              </SpotlightCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export default VideosSection;
