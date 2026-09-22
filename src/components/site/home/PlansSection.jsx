import { Check } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightCard } from "@/components/site/SpotlightCard";

const PLANS = [
  {
    name: "Monthly",
    price: "₹7,000",
    period: "/mo",
    billing: "Billed ₹7,000 every month",
    popular: false,
    badge: null,
    features: [
      "Full access to every program — Strength, Calisthenics, Animal Flow, Mobility & more",
      "Unlimited group classes",
      "Certified Trainer guidance every session",
      "Progress tracking",
    ],
  },
  {
    name: "Quarterly",
    price: "₹18,000",
    period: "/3mo",
    billing: "Billed ₹18,000 every 3 months",
    popular: true,
    badge: "MOST POPULAR",
    features: [
      "Full access to every program — Strength, Calisthenics, Animal Flow, Mobility & more",
      "Unlimited group classes",
      "Certified Trainer guidance every session",
      "Progress tracking",
      "1:1 quarterly fitness assessment",
      "Priority slot booking",
    ],
  },
];

export function PlansSection() {
  return (
    <section id="plans" className="py-24">
      <div className="mx-auto max-w-[100rem] px-6">
        <Reveal className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Memberships
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            A plan for every <span className="text-gradient">athlete</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
            Transparent pricing with zero hidden fees. Choose the commitment that aligns with your
            goals.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2 lg:gap-8">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 80}>
              <SpotlightCard
                className={`relative flex h-full flex-col justify-between rounded-3xl border p-6 sm:p-8 transition-all ${
                  plan.popular
                    ? "border-accent/60 bg-surface/90 ring-1 ring-accent/30 hover:border-accent"
                    : "border-border/60 bg-surface/40 hover:border-border"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-white/15 px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-md whitespace-nowrap shadow-sm">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-sm font-medium text-white/70">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/70">{plan.billing}</p>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-xs text-white">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white" />
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <a
                    href="#contact"
                    className={`block w-full rounded-full py-3 text-center text-sm font-semibold transition-all duration-200 ${
                      plan.popular
                        ? "bg-white text-black font-semibold shadow-md hover:bg-white/90"
                        : "border border-white/20 bg-background text-white hover:bg-white/10 hover:border-white/40"
                    }`}
                  >
                    Choose {plan.name}
                  </a>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
