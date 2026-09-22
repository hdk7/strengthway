import { Award, Check, Dumbbell, Trophy, Users } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";

const ABOUT_STATS = [
  { i: Users, k: "12k+", l: "Active members" },
  { i: Trophy, k: "98%", l: "Member satisfaction" },
  { i: Dumbbell, k: "48", l: "Certified trainers" },
  { i: Award, k: "15", l: "Award winning" },
];

export function AboutSection() {
  return (
    <section id="about" className="mx-auto max-w-[100rem] px-6 py-24">
      <div className="grid gap-16 md:grid-cols-2">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            About The Strength Way
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            A gym built like a <span className="text-gradient">product</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            We combine world-class Trainering with software that treats every member like an athlete
            worth investing in. Real programming, real progress, real accountability.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Personalized programming for every member",
              "Real-time attendance and slot booking",
              "Data-driven progress and health metrics",
              "Certified Traineres with proven track records",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-primary">
                  <Check className="h-3 w-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </Reveal>
        <div className="grid grid-cols-2 gap-4">
          {ABOUT_STATS.map((s, i) => (
            <Reveal key={s.l} delay={i * 80}>
              <SpotlightCard className="rounded-2xl border border-black bg-black p-6 transition-transform hover:-translate-y-1">
                <s.i className="h-6 w-6 text-white" />
                <div className="mt-6 font-display text-3xl font-bold text-white">{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/60">{s.l}</div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
