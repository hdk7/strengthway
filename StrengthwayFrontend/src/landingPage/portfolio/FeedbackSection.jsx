import { useState } from "react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from "@/components/ui/carousel";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import { resolveMediaUrl } from "@/lib/portfolioMedia";

export function FeedbackSection({ dataQuotes = [], dataVideos = [] }) {
  const [api, setApi] = useState();

  const quotesList = Array.isArray(dataQuotes) ? dataQuotes : [];
  const videosList = Array.isArray(dataVideos) ? dataVideos : [];

  if (quotesList.length === 0 && videosList.length === 0) {
    return null;
  }

  return (
    <section id="feedback" className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Reveal className="min-w-0">
        <SectionHeading
          eyebrow="Feedback"
          title={
            <>
              What members <span className="text-gradient">say</span>.
            </>
          }
        />
      </Reveal>

      {quotesList.length > 0 && (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {quotesList.map((f, i) => {
            const memberName = f.authorName || f.title || f.name || "Member";
            const memberRole = f.authorRole || f.subtitle || f.role || "Member";
            const quoteText = f.quote || f.tag || f.subtitle || "";

            return (
              <Reveal key={f.id || memberName || i} delay={i * 100} className="min-w-0">
                <SpotlightCard className="rounded-3xl border border-border bg-background p-6 sm:p-8 min-w-0">
                  <p className="text-sm leading-relaxed">&ldquo;{quoteText}&rdquo;</p>
                  <div className="mt-6">
                    <div className="font-semibold">{memberName}</div>
                    <div className="text-xs text-muted-foreground">{memberRole}</div>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      )}

      {videosList.length > 0 && (
        <Reveal delay={150}>
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="mt-14">
            <CarouselContent>
              {videosList.map((v, i) => {
                const videoSrc = resolveMediaUrl(v.mediaUrl || v.src);
                const posterSrc = v.thumbnailUrl ? resolveMediaUrl(v.thumbnailUrl) : undefined;
                const effectiveSrc = posterSrc ? videoSrc : `${videoSrc}#t=1.2`;
                return (
                  <CarouselItem key={v.id || v.title || i} className="basis-full sm:basis-1/2 lg:basis-1/3">
                    <div className="overflow-hidden rounded-2xl border border-border bg-background">
                      <video
                        src={effectiveSrc}
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
                        className="mx-auto aspect-9/16 max-h-[65vh] w-auto max-w-full bg-black object-cover"
                      />
                      <div className="p-4">
                        <div className="font-semibold">{v.title}</div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
          <CarouselDots api={api} count={videosList.length} />
        </Reveal>
      )}
    </section>
  );
}

export default FeedbackSection;
