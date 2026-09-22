import {
  Dumbbell,
  Flag,
  Flower2,
  Footprints,
  Hand,
  Move,
  PawPrint,
  PersonStanding,
  Waves,
  Wind,
} from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";

const ITEMS = [
  {
    title: "Functional Strength",
    desc: "Progressive overload, powerlifting fundamentals.",
    icon: Dumbbell,
  },
  {
    title: "Calisthenics",
    desc: "Bodyweight strength, control, and skill work.",
    icon: PersonStanding,
  },
  {
    title: "Animal Flow",
    desc: "Ground-based, ambidextrous movement patterns.",
    icon: PawPrint,
  },
  {
    title: "Mobility",
    desc: "Move better, prevent injuries, unlock range of motion.",
    icon: Move,
  },
  {
    title: "Flexibility",
    desc: "Deep stretching and range-of-motion conditioning.",
    icon: Waves,
  },
  {
    title: "Hand Balancing",
    desc: "Handstands, balance control, and body awareness.",
    icon: Hand,
  },
  {
    title: "Movement Training",
    desc: "Natural movement patterns for real-world strength.",
    icon: Footprints,
  },
  {
    title: "OCR",
    desc: "Obstacle course racing conditioning and grit work.",
    icon: Flag,
  },
  {
    title: "Tai Chi",
    desc: "Slow, flowing movement for balance and focus.",
    icon: Wind,
  },
  {
    title: "Yoga",
    desc: "Breath-led flexibility, strength, and mindfulness.",
    icon: Flower2,
  },
];

export function ProgramsSection() {
  return (
    <section id="programs" className="border-y border-border/60 bg-surface/30 py-24">
      <div className="mx-auto max-w-[100rem] px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              Programs
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
              Pick your <span className="text-gradient">discipline</span>.
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Every program is structured, ed, and tracked — no guesswork.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ITEMS.map((it, i) => (
            <Reveal key={it.title} delay={(i % 5) * 80}>
              <SpotlightCard className="overflow-hidden rounded-2xl border border-black bg-black p-6 transition-all hover:border-white/40 hover:card-glow">
                <it.icon className="h-8 w-8 text-white" />
                <h3 className="mt-6 font-display text-2xl font-bold text-white">{it.title}</h3>
                <p className="mt-2 text-sm text-white/60">{it.desc}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
