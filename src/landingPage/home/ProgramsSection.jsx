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
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";

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
    <section id="programs" className="border-y border-border/60 bg-surface/30 pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14">
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
              Programs
            </div>
            <h2 className="mt-3 sm:mt-4 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
              Pick your <span className="text-gradient">discipline</span>.
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Every program is structured, ed, and tracked — no guesswork.
          </p>
        </Reveal>

        <div className="mt-8 sm:mt-10 grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {ITEMS.map((it, i) => (
            <Reveal key={it.title} delay={(i % 5) * 80} className="min-w-0">
              <SpotlightCard className="overflow-hidden rounded-2xl border border-black bg-black p-5 sm:p-6 transition-all hover:border-white/40 hover:card-glow min-w-0 h-full flex flex-col justify-between">
                <div>
                  <it.icon className="h-8 w-8 text-white shrink-0" />
                  <h3 className="mt-6 font-display text-xl sm:text-2xl font-bold text-white break-words">{it.title}</h3>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">{it.desc}</p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
