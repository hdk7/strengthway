import { Check } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";

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
    <section id="plans" className="pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14">
      <div className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
            Memberships
          </div>
          <h2 className="mt-3 sm:mt-4 font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            A plan for every <span className="text-gradient">athlete</span>.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Transparent pricing with zero hidden fees. Choose the commitment that aligns with your
            goals.
          </p>
        </Reveal>

        <div className="mx-auto mt-8 sm:mt-10 grid max-w-4xl gap-5 sm:grid-cols-2 lg:gap-6">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 80} className="min-w-0">
              <SpotlightCard
                className={`relative flex h-full flex-col justify-between rounded-3xl border p-5 sm:p-8 transition-all min-w-0 ${
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
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
