import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import trainer2 from "@/assets/trainer-2.jpg";
import trainer3 from "@/assets/trainer-3.webp";
import portfolioPhoto3 from "@/assets/portfolio-photo-3.jpg";

const TRAINERS = [
  {
    id: "TRN-101",
    name: "Dolliee Ellens",
    img: trainer3,
    imgPosition: "object-top",
  },
  {
    id: "TRN-102",
    name: "Ashwin Kumar",
    img: portfolioPhoto3,
    imgPosition: "object-top",
  },
  {
    id: "TRN-103",
    name: "Robert Creflo",
    img: trainer2,
    imgPosition: "object-top",
  },
];

export function TrainersSection() {
  return (
    <section
      id="trainers"
      className="border-y border-border/60 bg-surface/30 pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14"
    >
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Trainers
          </div>
          <h2 className="mt-3 sm:mt-4 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Train with the <span className="text-gradient">best</span>.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Click on any trainer to view their full profile and form details.
          </p>
        </Reveal>

        <div className="mt-8 sm:mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRAINERS.map((t, i) => (
            <Reveal key={t.id} delay={i * 100} className="min-w-0">
              <Link
                to={`/trainers/${t.id}`}
                className="group block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-3xl min-w-0"
                aria-label={`View profile and form details for ${t.name}`}
              >
                <SpotlightCard className="relative overflow-hidden rounded-3xl border border-border/70 bg-card transition-all duration-300 group-hover:border-foreground/40 group-hover:shadow-2xl min-w-0">
                  {/* Floating Action Badge on Hover */}
                  <div className="pointer-events-none absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
                    <span>View Profile</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>

                  {/* Trainer Portrait Image */}
                  <div className="relative h-96 w-full overflow-hidden">
                    <img
                      src={t.img}
                      alt={t.name}
                      width={800}
                      height={1000}
                      loading="lazy"
                      className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 ${t.imgPosition ?? "object-center"}`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/90" />
                  </div>

                  {/* Bottom Information Card */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 z-10 flex items-end justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-white transition-colors duration-200 group-hover:text-white">
                        {t.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-white/90">
                        <span className="underline-offset-4 group-hover:underline">
                          View details & form →
                        </span>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
