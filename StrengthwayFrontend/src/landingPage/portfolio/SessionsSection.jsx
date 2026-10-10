import { useState, useEffect } from "react";
import { Dumbbell, Move, PawPrint, PersonStanding, Layers } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from "@/components/ui/carousel";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import { getPublicPortfolio } from "@/lib/portfolioService";
import sessionVideo1 from "@/assets/fewer-excuses-more-consistency.mp4";
import sessionVideo2 from "@/assets/quiet-work-loud-results.mp4";
import sessionVideo3 from "@/assets/every-class-an-opportunity.mp4";

const DEFAULT_SESSION_CLIPS = [sessionVideo1, sessionVideo2, sessionVideo3];

const ICON_MAP = {
  Dumbbell,
  PawPrint,
  PersonStanding,
  Move,
  Layers,
};

const DEFAULT_SESSIONS = [
  {
    title: "Strength Training",
    desc: "Progressive overload on barbell and rig work, Trainered rep by rep.",
    duration: "50 min",
    level: "All levels",
    icon: Dumbbell,
  },
  {
    title: "Animal Flow",
    desc: "Ground-based, ambidextrous movement patterns for full-body control.",
    duration: "45 min",
    level: "Intermediate",
    icon: PawPrint,
  },
  {
    title: "Calisthenics",
    desc: "Bodyweight strength and skill work — rings, bars, and progressions.",
    duration: "60 min",
    level: "All levels",
    icon: PersonStanding,
  },
  {
    title: "Mobility & Flexibility",
    desc: "Range-of-motion and recovery work to keep you training pain-free.",
    duration: "40 min",
    level: "All levels",
    icon: Move,
  },
];

export function SessionsSection({
  disciplines: initialDisciplines,
  sessionClips: initialClips,
}) {
  const [disciplinesData, setDisciplinesData] = useState(initialDisciplines || null);
  const [clipsData, setClipsData] = useState(initialClips || null);
  const [api, setApi] = useState();

  useEffect(() => {
    if (initialDisciplines) setDisciplinesData(initialDisciplines);
    if (initialClips) setClipsData(initialClips);
  }, [initialDisciplines, initialClips]);

  // Standalone fallback fetch
  useEffect(() => {
    if (!initialDisciplines && !initialClips) {
      getPublicPortfolio()
        .then((res) => {
          if (res?.sessionDisciplines && res.sessionDisciplines.length > 0) {
            setDisciplinesData(res.sessionDisciplines);
          }
          if (res?.sessionClips && res.sessionClips.length > 0) {
            setClipsData(res.sessionClips);
          }
        })
        .catch(() => {});
    }
  }, [initialDisciplines, initialClips]);

  const displayDisciplines =
    disciplinesData && disciplinesData.length > 0
      ? disciplinesData.map((d) => ({
          title: d.title,
          desc: d.description,
          duration: d.durationText || "45 min",
          level: d.level || "All levels",
          icon: ICON_MAP[d.iconKey] || Dumbbell,
        }))
      : DEFAULT_SESSIONS;

  const displayClips =
    clipsData && clipsData.length > 0
      ? clipsData.map((c) => (typeof c === "string" ? c : c.mediaUrl || c.src))
      : DEFAULT_SESSION_CLIPS;
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

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayDisciplines.map((s, i) => (
            <Reveal key={`${s.title}-${i}`} delay={i * 80} className="min-w-0">
              <SpotlightCard className="rounded-2xl border border-border bg-background p-5 sm:p-6 min-w-0">
                <s.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                  <span>{s.duration}</span>
                  <span>·</span>
                  <span>{s.level}</span>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        {/* Separate Training Sessions Video Carousel */}
        <Reveal delay={150}>
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="mt-14">
            <CarouselContent>
              {displayClips.map((src, i) => (
                <CarouselItem key={i} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <div className="overflow-hidden rounded-2xl border border-border bg-background">
                    <video
                      src={src}
                      controls
                      preload="metadata"
                      onPlay={(e) => handleVideoPlay(e.currentTarget)}
                      className="mx-auto aspect-9/16 max-h-[65vh] w-auto max-w-full bg-black object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <CarouselDots api={api} count={displayClips.length} />
        </Reveal>
      </div>
    </section>
  );
}
