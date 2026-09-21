import { ArrowRight } from "lucide-react";
import { Counter } from "@/components/site/Counter";
import heroImage from "@/assets/1mw.jpg";

// Placeholder gym metrics — replace with real numbers before launch.
const HERO_STATS = [
  { k: 12500, s: "+", l: "Members" },
  { k: 48, s: "", l: "Trainers" },
  { k: 97, s: "%", l: "Retention" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <img
        src={heroImage}
        alt="The Strength Way"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 radial-brand" />

      <div className="relative ml-auto max-w-xl px-6 py-20 text-left md:py-32 md:pr-16 lg:max-w-2xl">
        <div className="relative z-10 animate-fade-in">
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
            Train harder.
            <br />
            <span className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
              Track smarter.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-white/70 sm:text-lg">
            The premium operating system for modern gyms. Manage members, book slots with elite
            trainers, and unlock analytics that turn effort into results.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-black shadow-lg transition-transform hover:scale-105"
            >
              Start Training
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#about"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              See how it works
            </a>
          </div>

          <div className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {HERO_STATS.map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-bold text-white">
                  <Counter end={s.k} suffix={s.s} />
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/60">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
