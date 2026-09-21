import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";
import { SectionHeading } from "./SectionHeading";
import { handleVideoPlay } from "./portfolioVideo";
import video1 from "@/assets/portfolio-video-1.mp4";
import video2 from "@/assets/portfolio-video-2.mp4";
import video3 from "@/assets/portfolio-video-3.mp4";
import video4 from "@/assets/portfolio-video-4.mp4";
import video5 from "@/assets/portfolio-video-5.mp4";
import video6 from "@/assets/portfolio-video-6.mp4";

const VIDEOS = [
  { src: video1, title: "Rig conditioning" },
  { src: video5, title: "Animal Flow session" },
  { src: video6, title: "Flowing again after ACL & meniscus recovery" },
  { src: video4, title: "Strength circuit" },
  { src: video2, title: "Movement warm-up" },
  { src: video3, title: "Flow drill" },
];

export function VideosSection() {
  return (
    <section id="videos" className="mx-auto max-w-[100rem] px-6 py-24">
      <Reveal>
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
        {VIDEOS.map((v, i) => (
          <Reveal key={v.title} delay={(i % 3) * 80}>
            <SpotlightCard className="overflow-hidden rounded-2xl border border-border bg-surface/50">
              <video
                src={v.src}
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
