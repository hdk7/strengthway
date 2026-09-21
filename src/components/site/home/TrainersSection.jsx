import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";
import trainer2 from "@/assets/trainer-2.jpg";
import trainer3 from "@/assets/trainer-3.webp";
import portfolioPhoto3 from "@/assets/portfolio-photo-3.jpg";

const TRAINERS = [
  {
    name: "Dolliee Ellens",
    spec: "Functional Fitness",
    img: trainer3,
    imgPosition: "object-top",
  },
  {
    name: "Ashwin",
    spec: "Functional Fitness",
    img: portfolioPhoto3,
    imgPosition: "object-top",
  },
  {
    name: "Robert Creflo",
    spec: "Functional Fitness",
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
            Coaches
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            Train with the <span className="text-gradient">best</span>.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TRAINERS.map((t, i) => (
            <Reveal key={t.name} delay={i * 100}>
              <SpotlightCard className="group relative overflow-hidden rounded-3xl border border-border bg-background">
                <img
                  src={t.img}
                  alt={t.name}
                  width={800}
                  height={1000}
                  loading="lazy"
                  className={`h-96 w-full object-cover transition-transform duration-500 group-hover:scale-105 ${t.imgPosition ?? "object-center"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display text-2xl font-bold text-white">{t.name}</h3>
                  <p className="text-sm text-white/80">{t.spec}</p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
