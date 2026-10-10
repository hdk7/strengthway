import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from "@/components/ui/carousel";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import { getPublicPortfolio } from "@/lib/portfolioService";
import video7 from "@/assets/portfolio-video-7.mp4";
import video8 from "@/assets/portfolio-video-8.mp4";
import video9 from "@/assets/portfolio-video-9.mp4";

const DEFAULT_SESSION_VIDEOS = [
  { src: video7, title: "Where it all starts" },
  { src: video8, title: "Madhav's transformation" },
  { src: video9, title: "Varshini's progress" },
];

const DEFAULT_FEEDBACK = [
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

export function FeedbackSection({ feedbackStories: initialStories }) {
  const [storiesData, setStoriesData] = useState(initialStories || null);
  const [api, setApi] = useState();

  useEffect(() => {
    if (initialStories) setStoriesData(initialStories);
  }, [initialStories]);

  // Standalone fallback fetch
  useEffect(() => {
    if (!initialStories) {
      getPublicPortfolio()
        .then((res) => {
          if (res?.feedbackStories && res.feedbackStories.length > 0) {
            setStoriesData(res.feedbackStories);
          }
        })
        .catch(() => {});
    }
  }, [initialStories]);

  // Separate text quotes from testimonial videos
  const dynamicQuotes =
    storiesData?.filter(
      (s) => (s.quote && s.quote.trim()) || (s.authorName && s.authorName.trim())
    ) || [];

  const dynamicVideos =
    storiesData?.filter(
      (s) =>
        s.mediaType === "VIDEO" ||
        (s.mediaUrl && s.mediaUrl.match(/\.(mp4|webm|mov)$/i))
    ) || [];

  const displayFeedback =
    dynamicQuotes.length > 0
      ? dynamicQuotes.map((f) => ({
          name: f.authorName || f.title,
          role: f.authorRole || "Member",
          quote: f.quote || f.description,
          rating: f.rating || 5,
        }))
      : DEFAULT_FEEDBACK;

  const displayVideos =
    dynamicVideos.length > 0
      ? dynamicVideos.map((v) => ({
          src: v.mediaUrl,
          title: v.title || "Member story",
        }))
      : DEFAULT_SESSION_VIDEOS;

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
      <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {displayFeedback.map((f, i) => (
          <Reveal key={`${f.name}-${i}`} delay={i * 100} className="min-w-0">
            <SpotlightCard className="rounded-3xl border border-border bg-background p-6 sm:p-8 min-w-0">
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: f.rating || 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-primary" />
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
            {displayVideos.map((v, i) => (
              <CarouselItem key={`${v.title}-${i}`} className="basis-full sm:basis-1/2 lg:basis-1/3">
                <div className="overflow-hidden rounded-2xl border border-border bg-background">
                  <video
                    src={v.src}
                    controls
                    preload="metadata"
                    onPlay={(e) => handleVideoPlay(e.currentTarget)}
                    className="mx-auto aspect-9/16 max-h-[65vh] w-auto max-w-full bg-black object-cover"
                  />
                  <div className="p-4">
                    <div className="font-semibold">{v.title}</div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <CarouselDots api={api} count={displayVideos.length} />
      </Reveal>
    </section>
  );
}

