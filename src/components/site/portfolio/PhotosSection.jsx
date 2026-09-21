import { useEffect, useState } from "react";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SectionHeading } from "./SectionHeading";
import photo1 from "@/assets/portfolio-photo-1.jpg";
import photo2 from "@/assets/portfolio-photo-2.jpg";
import photo3 from "@/assets/portfolio-photo-3.jpg";
import photo4 from "@/assets/portfolio-photo-4.jpg";
import photo5 from "@/assets/portfolio-photo-5.jpg";
import photo6 from "@/assets/portfolio-photo-6.jpg";
import photo7 from "@/assets/portfolio-photo-7.jpg";
import photo8 from "@/assets/portfolio-photo-8.jpg";

const PHOTOS = [
  { src: photo1, alt: "Weighted pull-ups on the rig" },
  { src: photo2, alt: "Training partners working the bar together" },
  { src: photo3, alt: "Inverted ring hold" },
  { src: photo4, alt: "Ring dip conditioning" },
  { src: photo5, alt: "Partners facing off on the pull-up bar" },
  { src: photo6, alt: "Evening pull-up set in the rig" },
  { src: photo7, alt: "Ground-based movement work" },
  { src: photo8, alt: "Member after a fight-camp session" },
];

export function PhotosSection({ onSelectPhoto }) {
  const [api, setApi] = useState();
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!api) return;
    const pause = () => setPlaying(false);
    const resume = () => setPlaying(true);
    api.on("pointerDown", pause);
    api.on("pointerUp", resume);
    return () => {
      api.off("pointerDown", pause);
      api.off("pointerUp", resume);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(id);
  }, [api, playing]);

  return (
    <section id="photos" className="border-y border-border/60 bg-surface/30 py-24">
      <div className="mx-auto max-w-[100rem] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Photos"
            title={
              <>
                Moments from the <span className="text-gradient">floor</span>.
              </>
            }
          />
        </Reveal>

        <Reveal
          delay={100}
          className="mt-12 px-2 sm:px-14"
          onMouseEnter={() => setPlaying(false)}
          onMouseLeave={() => setPlaying(true)}
        >
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }}>
            <CarouselContent>
              {PHOTOS.map((p) => (
                <CarouselItem key={p.alt} className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                  <SpotlightCard
                    as="button"
                    type="button"
                    onClick={() => onSelectPhoto(p)}
                    className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border text-left transition-transform hover:scale-[1.02] focus:outline-none"
                  >
                    <img
                      src={p.src}
                      alt={p.alt}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </SpotlightCard>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="transition-transform hover:scale-125" />
            <CarouselNext className="transition-transform hover:scale-125" />
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}
