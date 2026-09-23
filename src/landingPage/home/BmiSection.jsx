import { BmiCalculator } from "@/landingPage/BmiCalculator";
import { Reveal } from "@/landingPage/Reveal";

export function BmiSection() {
  return (
    <section id="bmi" className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8 pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14">
      <Reveal className="min-w-0">
        <BmiCalculator />
      </Reveal>
    </section>
  );
}
