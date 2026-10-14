import { useState } from "react";
import { Dumbbell, Move, PawPrint, PersonStanding, Flame, Zap, HeartPulse, Activity } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from "@/components/ui/carousel";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import { resolveMediaUrl } from "@/lib/portfolioMedia";

const ICON_MAP = {
  Dumbbell,
  Move,
  PawPrint,
  PersonStanding,
  Flame,
  Zap,
  HeartPulse,
  Activity,
};

export function SessionsSection({ dataSessions = [], dataClips = [] }) {
  const [api, setApi] = useState();

  const sessionsList = Array.isArray(dataSessions) ? dataSessions : [];
  const clipsList = Array.isArray(dataClips) ? dataClips : [];

  if (sessionsList.length === 0 && clipsList.length === 0) {
    return null;
  }

  return (
    <section id="sessions" className="border-y border-border/60 bg-card/30 py-16 sm:py-24">
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <Reveal className="min-w-0">
          <SectionHeading
            eyebrow="Training sessions"
            title={
              <>
                Sessions we <span className="text-gradient">run</span>.
              </>
            }
          />
        </Reveal>

        {sessionsList.length > 0 && (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sessionsList.map((s, i) => {
              const iconKey = s.icon || s.iconKey || "Dumbbell";
              const IconComponent =
                typeof iconKey === "string" ? ICON_MAP[iconKey] || Dumbbell : iconKey || Dumbbell;
              return (
                <Reveal key={s.id || s.title || i} delay={i * 80} className="min-w-0">
                  <SpotlightCard className="rounded-2xl border border-border bg-background p-5 sm:p-6 min-w-0">
                    <IconComponent className="h-8 w-8 text-primary" />
                    <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.subtitle || s.description || s.desc}</p>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        )}

        {/* Separate Training Sessions Video Carousel */}
        {clipsList.length > 0 && (
          <Reveal delay={150}>
            <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="mt-14">
              <CarouselContent>
                {clipsList.map((item, i) => {
                  const rawUrl = typeof item === "string" ? item : item.mediaUrl || item.src;
                  const videoSrc = resolveMediaUrl(rawUrl);
                  const rawPoster = typeof item === "object" ? item.thumbnailUrl : undefined;
                  const posterSrc = rawPoster ? resolveMediaUrl(rawPoster) : undefined;
                  const effectiveSrc = posterSrc ? videoSrc : `${videoSrc}#t=1.2`;

                  return (
                    <CarouselItem key={item.id || i} className="basis-full sm:basis-1/2 lg:basis-1/3">
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
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
            </Carousel>
            <CarouselDots api={api} count={clipsList.length} />
          </Reveal>
        )}
      </div>
    </section>
  );
}

export default SessionsSection;
