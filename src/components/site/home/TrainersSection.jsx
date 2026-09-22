import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";
import trainer2 from "@/assets/trainer-2.jpg";
import trainer3 from "@/assets/trainer-3.webp";
import portfolioPhoto3 from "@/assets/portfolio-photo-3.jpg";

const TRAINERS = [
  {
    id: "TRN-101",
    name: "Dolliee Ellens",
    spec: "Functional Fitness & Mobility",
    experience: "5+ Years",
    shift: "Morning Shift",
    img: trainer3,
    imgPosition: "object-top",
  },
  {
    id: "TRN-102",
    name: "Ashwin Kumar",
    spec: "Strength & Conditioning",
    experience: "7+ Years",
    shift: "Evening Shift",
    img: portfolioPhoto3,
    imgPosition: "object-top",
  },
  {
    id: "TRN-103",
    name: "Robert Creflo",
    spec: "Hypertrophy & Rehabilitation",
    experience: "6+ Years",
    shift: "General Shift",
    img: trainer2,
    imgPosition: "object-top",
  },
];

export function TrainersSection() {
  return (
    <section id="trainers" className="border-y border-border/60 bg-surface/30 py-24">
      <div className="mx-auto max-w-[100rem] px-6">
        <Reveal className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Trainer
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            Train with the <span className="text-gradient">best</span>.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Click on any trainer to view their full profile and form details.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TRAINERS.map((t, i) => (
            <Reveal key={t.id} delay={i * 100}>
              <Link
                to={`/trainers/${t.id}`}
                className="group block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white rounded-3xl"
                aria-label={`View profile and form details for ${t.name}`}
              >
                <SpotlightCard className="relative overflow-hidden rounded-3xl border border-border/70 bg-background transition-all duration-300 group-hover:border-white/40 group-hover:shadow-2xl">
                  {/* Floating Action Badge on Hover */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-semibold text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-300 group-hover:from-black/90" />
                  </div>

                  {/* Bottom Information Card */}
                  <div className="absolute inset-x-0 bottom-0 p-6 z-10 flex items-end justify-between">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-white transition-colors duration-200 group-hover:text-white">
                        {t.name}
                      </h3>
                      <p className="mt-0.5 text-sm text-white/80 font-medium">{t.spec}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                        <span>{t.shift}</span>
                        <span>•</span>
                        <span className="text-white/90 underline-offset-4 group-hover:underline">
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
