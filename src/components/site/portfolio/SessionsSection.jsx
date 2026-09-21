import { useState } from "react";
import { Dumbbell, Move, PawPrint, PersonStanding } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";
import { CarouselDots } from "@/components/site/CarouselDots";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import sessionVideo1 from "@/assets/fewer-excuses-more-consistency.mp4";
import sessionVideo2 from "@/assets/quiet-work-loud-results.mp4";
import sessionVideo3 from "@/assets/every-class-an-opportunity.mp4";

const SESSION_CLIPS = [sessionVideo1, sessionVideo2, sessionVideo3];

const SESSIONS = [
  {
    title: "Strength Training",
    desc: "Progressive overload on barbell and rig work, coached rep by rep.",
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

export function SessionsSection({ onJoin }) {
  const [api, setApi] = useState();
  return (
    <section id="sessions" className="border-y border-border/60 bg-surface/30 py-24">
      <div className="mx-auto max-w-[100rem] px-6">
        <Reveal>
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
          {SESSIONS.map((s, i) => (
            <Reveal key={s.title} delay={i * 80}>
              <SpotlightCard className="rounded-2xl border border-border bg-background p-6">
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
              {SESSION_CLIPS.map((src, i) => (
                <CarouselItem key={i} className="basis-full sm:basis-1/2 lg:basis-1/3">
                  <div className="overflow-hidden rounded-2xl border border-border bg-background">
                    <video
                      src={src}
                      controls
                      preload="metadata"
                      onPlay={(e) => handleVideoPlay(e.currentTarget)}
                      className="mx-auto aspect-[9/16] max-h-[65vh] w-auto max-w-full bg-black object-cover"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <CarouselDots api={api} count={SESSION_CLIPS.length} />
        </Reveal>

        <Reveal delay={200} className="mt-10 text-center">
          <button
            type="button"
            onClick={onJoin}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            Book a session
          </button>
        </Reveal>
      </div>
    </section>
  );
}
