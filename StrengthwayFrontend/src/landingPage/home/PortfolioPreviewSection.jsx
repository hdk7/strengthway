import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { Carousel, CarouselContent, CarouselItem, CarouselDots } from "@/components/ui/carousel";
import { getPublicPortfolio } from "@/lib/portfolioService";
import portfolioPhoto1 from "@/assets/portfolio-photo-1.jpg";
import portfolioPhoto2 from "@/assets/portfolio-photo-2.jpg";
import portfolioPhoto3 from "@/assets/portfolio-photo-3.jpg";
import portfolioPhoto4 from "@/assets/portfolio-photo-4.jpg";
import portfolioPhoto5 from "@/assets/portfolio-photo-5.jpg";
import portfolioPhoto6 from "@/assets/portfolio-photo-6.jpg";
import portfolioPhoto7 from "@/assets/portfolio-photo-7.jpg";
import portfolioPhoto8 from "@/assets/portfolio-photo-8.jpg";

const DEFAULT_PREVIEW_PHOTOS = [
  { src: portfolioPhoto1, alt: "Gym floor calisthenics training" },
  { src: portfolioPhoto2, alt: "Bar work session" },
  { src: portfolioPhoto3, alt: "Inverted ring hold" },
  { src: portfolioPhoto4, alt: "Ring dip conditioning" },
  { src: portfolioPhoto5, alt: "Pull-up bar partners" },
  { src: portfolioPhoto6, alt: "Evening session rig" },
  { src: portfolioPhoto7, alt: "Ground-based movement" },
  { src: portfolioPhoto8, alt: "Fight camp athlete" },
];

export function PortfolioPreviewSection() {
  const [photosData, setPhotosData] = useState(null);
  const [api, setApi] = useState();

  useEffect(() => {
    let isMounted = true;
    getPublicPortfolio()
      .then((res) => {
        if (isMounted && res?.homepagePhotos && res.homepagePhotos.length > 0) {
          setPhotosData(res.homepagePhotos);
        }
      })
      .catch((err) => {
        console.warn("Portfolio preview fetch failed, using fallback:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const displayPhotos =
    photosData && photosData.length > 0
      ? photosData.map((p) => ({
          src: p.mediaUrl || p.src,
          alt: p.altText || p.title || "Gym floor photo",
        }))
      : DEFAULT_PREVIEW_PHOTOS;

  return (
    <section id="portfolio" className="border-y border-border/60 bg-card/30 pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14">
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
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 font-semibold transition-colors hover:bg-card"
          >
            See full portfolio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={100}>
          <Carousel setApi={setApi} opts={{ align: "start", loop: true }} className="mt-8 sm:mt-10">
            <CarouselContent>
              {displayPhotos.map((p, i) => (
                <CarouselItem key={i} className="basis-1/2 sm:basis-1/3 lg:basis-1/4">
                  <img
                    src={p.src}
                    alt={p.alt}
                    loading="lazy"
                    className="aspect-3/4 w-full rounded-2xl border border-border object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <CarouselDots api={api} count={displayPhotos.length} />
        </Reveal>
      </div>
    </section>
  );
}
