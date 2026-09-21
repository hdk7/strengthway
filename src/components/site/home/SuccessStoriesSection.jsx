import { Counter } from "@/components/site/Counter";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";

const SUCCESS_STATS = [
  { k: 12000, s: "+", l: "Transformations" },
  { k: 4500, s: "", l: "Lbs lost total" },
  { k: 320, s: "", l: "PRs / month" },
  { k: 98, s: "%", l: "Satisfaction" },
];

export function SuccessStoriesSection() {
  return (
    <section className="mx-auto max-w-[100rem] px-6 py-24">
      <Reveal
        as="div"
        className="overflow-hidden rounded-3xl border border-border bg-surface/40 p-10 md:p-16 radial-brand"
      >
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              Success stories
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
              Real people. <span className="text-gradient">Real results.</span>
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Every number here is a member who showed up. Our job is to make sure they leave
              stronger than they came.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {SUCCESS_STATS.map((s, i) => (
              <Reveal key={s.l} delay={i * 80}>
                <SpotlightCard className="rounded-2xl border border-black bg-black p-6 text-center">
                  <div className="font-display text-4xl font-bold text-white">
                    <Counter end={s.k} suffix={s.s} />
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-widest text-white/60">{s.l}</div>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
