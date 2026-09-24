import { Award, Check, Dumbbell, Trophy, Users } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";

const ABOUT_STATS = [
  { i: Users, k: "12k+", l: "Active members" },
  { i: Trophy, k: "98%", l: "Member satisfaction" },
  { i: Dumbbell, k: "48", l: "Certified trainers" },
  { i: Award, k: "15", l: "Award winning" },
];

export function AboutSection() {
  return (
    <section
      id="about"
      className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8 pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14"
    >
      <div className="grid gap-8 md:gap-10 lg:gap-14 md:grid-cols-2 items-center">
        <Reveal className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            About The Strength Way
          </div>
          <h2 className="mt-3 sm:mt-4 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            A gym built like a <span className="text-gradient">product</span>.
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground">
            We combine world-class Trainering with software that treats every member like an athlete
            worth investing in. Real programming, real progress, real accountability.
          </p>
          <ul className="mt-6 sm:mt-8 space-y-2.5 sm:space-y-3 text-sm">
            {[
              "Personalized programming for every member",
              "Real-time attendance and slot booking",
              "Data-driven progress and health metrics",
              "Certified Traineres with proven track records",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-primary shrink-0">
                  <Check className="h-3 w-3" />
                </span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 min-w-0">
          {ABOUT_STATS.map((s, i) => (
            <Reveal key={s.l} delay={i * 80} className="min-w-0">
              <SpotlightCard className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 transition-transform hover:-translate-y-1 min-w-0 shadow-xs">
                <s.i className="h-6 w-6 text-foreground" />
                <div className="mt-4 sm:mt-6 font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {s.k}
                </div>
                <div className="mt-1 text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-muted-foreground truncate">
                  {s.l}
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
