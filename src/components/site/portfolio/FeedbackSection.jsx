import { useState } from "react";
import { Star } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";
import { CarouselDots } from "@/components/site/CarouselDots";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import video7 from "@/assets/portfolio-video-7.mp4";
import video8 from "@/assets/portfolio-video-8.mp4";
import video9 from "@/assets/portfolio-video-9.mp4";

const SESSION_VIDEOS = [
  { src: video7, title: "Where it all starts" },
  { src: video8, title: "Madhav's transformation" },
  { src: video9, title: "Varshini's progress" },
];

const FEEDBACK = [
  {
    name: "Aarav M.",
    role: "Member since 2025",
    quote:
      "Six months of Animal Flow and calisthenics here changed how my body moves, not just how it looks.",
    rating: 5,
  },
  {
    name: "Meera K.",
    role: "Quarterly Member",
    quote:
      "The Traineres actually watch your form. I've never felt this dialed-in during a session.",
    rating: 5,
  },
  {
    name: "Devansh R.",
    role: "Quarterly Member",
    quote:
      "Booked a strength session on a whim and ended up rebuilding my whole routine around it.",
    rating: 5,
  },
];

export function FeedbackSection() {
  const [api, setApi] = useState();
  return (
    <section className="mx-auto max-w-[100rem] px-6 py-24">
      <Reveal>
        <SectionHeading
          eyebrow="Feedback"
          title={
            <>
              What members <span className="text-gradient">say</span>.
            </>
          }
        />
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {FEEDBACK.map((f, i) => (
          <Reveal key={f.name} delay={i * 100}>
            <SpotlightCard className="rounded-3xl border border-border bg-background p-8">
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: f.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed">&ldquo;{f.quote}&rdquo;</p>
              <div className="mt-6">
                <div className="font-semibold">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.role}</div>
              </div>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={150}>
        <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="mt-14">
          <CarouselContent>
            {SESSION_VIDEOS.map((v) => (
              <CarouselItem key={v.title} className="basis-full sm:basis-1/2 lg:basis-1/3">
                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                  <video
                    src={v.src}
                    controls
                    preload="metadata"
                    onPlay={(e) => handleVideoPlay(e.currentTarget)}
                    className="mx-auto aspect-[9/16] max-h-[65vh] w-auto max-w-full bg-black object-cover"
                  />
                  <div className="p-4">
                    <div className="font-semibold">{v.title}</div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <CarouselDots api={api} count={SESSION_VIDEOS.length} />
      </Reveal>
    </section>
  );
}
