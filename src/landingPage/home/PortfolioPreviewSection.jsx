import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from "@/components/ui/carousel";
import portfolioPhoto1 from "@/assets/portfolio-photo-1.jpg";
import portfolioPhoto2 from "@/assets/portfolio-photo-2.jpg";
import portfolioPhoto3 from "@/assets/portfolio-photo-3.jpg";
import portfolioPhoto4 from "@/assets/portfolio-photo-4.jpg";
import portfolioPhoto5 from "@/assets/portfolio-photo-5.jpg";
import portfolioPhoto6 from "@/assets/portfolio-photo-6.jpg";
import portfolioPhoto7 from "@/assets/portfolio-photo-7.jpg";
import portfolioPhoto8 from "@/assets/portfolio-photo-8.jpg";

const PORTFOLIO_PREVIEW_PHOTOS = [
  portfolioPhoto1,
  portfolioPhoto2,
  portfolioPhoto3,
  portfolioPhoto4,
  portfolioPhoto5,
  portfolioPhoto6,
  portfolioPhoto7,
  portfolioPhoto8,
];

export function PortfolioPreviewSection() {
  const [api, setApi] = useState();
  return (
    <section id="portfolio" className="border-y border-border/60 bg-surface/30 pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14">
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              Portfolio
            </div>
            <h2 className="mt-3 sm:mt-4 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
              Break Yourself & <span className="text-gradient">Recreate Yourself</span>.
            </h2>
          </div>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 font-semibold transition-colors hover:bg-surface"
          >
            See full portfolio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="mt-8 sm:mt-10">
            <CarouselContent>
              {PORTFOLIO_PREVIEW_PHOTOS.map((src, i) => (
                <CarouselItem key={i} className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="aspect-[3/4] w-full rounded-2xl border border-border object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <CarouselDots api={api} count={PORTFOLIO_PREVIEW_PHOTOS.length} />
        </Reveal>
      </div>
    </section>
  );
}
