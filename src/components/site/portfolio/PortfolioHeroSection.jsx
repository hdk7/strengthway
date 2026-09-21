import { Reveal } from "@/components/site/Reveal";

export function PortfolioHeroSection({ onJoin }) {
  return (
    <section className="mx-auto max-w-[100rem] px-6 pb-8 pt-20 text-center">
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
        <button
          type="button"
          onClick={onJoin}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          Join Now
        </button>
      </Reveal>
    </section>
  );
}
