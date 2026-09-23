import { ArrowRight } from "lucide-react";
import { Counter } from "@/landingPage/Counter";
import heroImage from "@/assets/1mw.jpg";

// Placeholder gym metrics — replace with real numbers before launch.
const HERO_STATS = [
  { k: 12500, s: "+", l: "Members" },
  { k: 48, s: "", l: "Trainers" },
  { k: 97, s: "%", l: "Retention" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] flex flex-col justify-center overflow-hidden">
      <img
        src={heroImage}
        alt="The Strength Way"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 radial-brand" />

      <div className="relative mx-auto w-full max-w-[100rem] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="relative ml-auto max-w-xl text-left md:pr-6 lg:max-w-2xl">
          <div className="relative z-10 animate-fade-in">
            <h1 className="mt-1 sm:mt-2 font-display text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Train harder.
              <br />
              <span className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
                Track smarter.
              </span>
            </h1>
            <p className="mt-2.5 sm:mt-4 max-w-lg text-sm text-white/75 sm:text-base leading-relaxed">
              The premium operating system for modern Strength Training. Manage members, book slots with elite
              trainers, and unlock analytics that turn effort into results.
            </p>
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <a
                href="#programs"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 sm:py-3.5 font-semibold text-black shadow-lg transition-transform hover:scale-105 cursor-pointer text-sm sm:text-base"
              >
                Explore Programs
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 sm:py-3.5 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 text-sm sm:text-base"
              >
                See how it works
              </a>
            </div>

            <div className="mt-5 sm:mt-8 grid max-w-md grid-cols-3 gap-3 sm:gap-6">
              {HERO_STATS.map((s) => (
                <div key={s.l} className="min-w-0">
                  <div className="font-display text-2xl sm:text-3xl font-bold text-white whitespace-nowrap">
                    <Counter end={s.k} suffix={s.s} />
                  </div>
                  <div className="mt-1 text-[11px] sm:text-xs uppercase tracking-wider text-white/60 truncate">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
