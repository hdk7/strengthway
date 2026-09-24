import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import { SpotlightCard } from "@/landingPage/SpotlightCard";
import { getMembershipPlans } from "@/lib/membershipPlans";

export function PlansSection() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const load = () => {
      const active = getMembershipPlans(false);
      setPlans(active.length > 0 ? active : getMembershipPlans(true));
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

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

        <div
          className={`mx-auto mt-8 sm:mt-10 grid gap-5 sm:grid-cols-2 ${
            plans.length >= 4
              ? "lg:grid-cols-4 max-w-7xl"
              : plans.length === 3
                ? "lg:grid-cols-3 max-w-5xl"
                : "max-w-4xl"
          } lg:gap-6`}
        >
          {plans.map((plan, i) => (
            <Reveal key={plan.id || plan.name} delay={i * 80} className="min-w-0">
              <SpotlightCard
                className={`relative flex h-full flex-col justify-between rounded-3xl border p-5 sm:p-8 transition-all min-w-0 ${
                  plan.popular
                    ? "border-foreground/30 bg-card ring-1 ring-foreground/20 shadow-md hover:border-foreground/50"
                    : "border-border/80 bg-card shadow-xs hover:border-foreground/30"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-foreground/20 bg-foreground text-background px-3.5 py-0.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm">
                    {plan.badge}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                      {plan.formattedPrice || `₹${plan.price?.toLocaleString("en-IN")}`}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{plan.billing || plan.description}</p>

                  <ul className="mt-6 space-y-3">
                    {plan.features?.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
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
