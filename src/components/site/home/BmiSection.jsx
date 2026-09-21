import { BmiCalculator } from "@/components/site/BmiCalculator";
import { Reveal } from "@/components/site/Reveal";

export function BmiSection() {
  return (
    <section id="bmi" className="mx-auto max-w-[100rem] px-6 py-24">
      <Reveal>
        <BmiCalculator />
      </Reveal>
    </section>
  );
}
