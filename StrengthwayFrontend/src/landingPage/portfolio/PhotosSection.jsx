import { useEffect, useState } from "react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SectionHeading } from "./SectionHeading";
import { resolveMediaUrl } from "@/lib/portfolioMedia";

export function PhotosSection({ onSelectPhoto, dataPhotos = [] }) {
  const [api, setApi] = useState();
  const [playing, setPlaying] = useState(true);

  const photosList = Array.isArray(dataPhotos) ? dataPhotos : [];

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

  if (photosList.length === 0) {
    return null;
  }

  return (
    <section id="photos" className="border-y border-border/60 bg-card/30 py-16 sm:py-24">
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <Reveal className="min-w-0">
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
          className="mt-12 px-0 sm:px-14 min-w-0"
          onMouseEnter={() => setPlaying(false)}
          onMouseLeave={() => setPlaying(true)}
        >
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }}>
            <CarouselContent>
              {photosList.map((p, i) => {
                const photoSrc = resolveMediaUrl(p.mediaUrl || p.src);
                const photoAlt = p.title || p.altText || p.alt || p.tag || "Floor moment";
                return (
                  <CarouselItem key={p.id || photoAlt || i} className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                    <SpotlightCard
                      as="button"
                      type="button"
                      onClick={() => onSelectPhoto({ src: photoSrc, alt: photoAlt })}
                      className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border text-left transition-transform hover:scale-[1.02] focus:outline-none"
                    >
                      <img
                        src={photoSrc}
                        alt={photoAlt}
                        loading="lazy"
                        className="aspect-4/5 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </SpotlightCard>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="transition-transform hover:scale-125" />
            <CarouselNext className="transition-transform hover:scale-125" />
          </Carousel>
        </Reveal>
      </div>
    </section>
  );
}

export default PhotosSection;
