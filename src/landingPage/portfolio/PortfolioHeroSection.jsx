import { Reveal } from "@/landingPage/Reveal";

export function PortfolioHeroSection() {
  return (
    <section className="mx-auto max-w-[100rem] px-6 pb-8 pt-10 sm:pt-14 text-center">
      <Reveal>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          Portfolio
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
          Real training. <span className="text-gradient">Real people.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          A look inside The Strength Way — the sessions, the sweat, and the members who show up for
          it.
        </p>
      </Reveal>
    </section>
  );
}
