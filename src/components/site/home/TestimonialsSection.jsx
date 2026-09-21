import { Quote } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";

// Placeholder testimonials — replace with real member quotes before launch.
const TESTIMONIALS = [
  {
    quote:
      "The Strength Way made booking, tracking, and training seamless. I've never been more consistent.",
    name: "Sara L.",
    role: "Quarterly Member",
  },
  {
    quote: "The trainers here don't play. Real programming, real results — down 24 lbs.",
    name: "James T.",
    role: "Quarterly Member",
  },
  {
    quote: "Best facility in the city. The app makes managing everything effortless.",
    name: "Priya R.",
    role: "Monthly Member",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-y border-border/60 bg-surface/30 py-24">
      <div className="mx-auto max-w-[100rem] px-6">
        <Reveal className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Testimonials
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            Loved by <span className="text-gradient">athletes</span>.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((x, i) => (
            <Reveal key={x.name} delay={i * 100}>
              <SpotlightCard className="rounded-3xl border border-black bg-black p-8 transition-transform hover:-translate-y-1">
                <Quote className="h-8 w-8 text-white" />
                <p className="mt-4 text-sm leading-relaxed text-white/80">{x.quote}</p>
                <div className="mt-6">
                  <div className="font-semibold text-white">{x.name}</div>
                  <div className="text-xs text-white/60">{x.role}</div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
