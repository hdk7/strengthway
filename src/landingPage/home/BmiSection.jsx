import { useState } from "react";
import { Activity, Minus, Plus } from "lucide-react";
import { Reveal } from "@/landingPage/Reveal";
import bmiUnderweightImg from "@/assets/bmi/bmi-underweight.jpg";
import bmiNormalImg from "@/assets/bmi/bmi-normal.jpg";
import bmiOverweightImg from "@/assets/bmi/bmi-overweight.jpg";
import bmiObeseImg from "@/assets/bmi/bmi-obese.jpg";

const BMI_CATEGORIES = {
  Underweight: {
    image: bmiUnderweightImg,
    range: "< 18.5",
    desc: "Focus on caloric surplus and progressive strength building.",
  },
  Normal: {
    image: bmiNormalImg,
    range: "18.5 – 24.9",
    desc: "Optimal body composition. Maintain strength & athletic performance.",
  },
  Overweight: {
    image: bmiOverweightImg,
    range: "25.0 – 29.9",
    desc: "Great foundation for body recomposition & high-intensity training.",
  },
  Obese: {
    image: bmiObeseImg,
    range: "≥ 30.0",
    desc: "Transform your power with structured coaching & healthy habits.",
  },
};

function Range({ label, value, min, max, unit, onChange }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm text-muted-foreground">{label}</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-accent/20 active:scale-95 transition-all cursor-pointer"
            aria-label={`Decrease ${label}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[4rem] text-right font-display text-lg font-bold text-foreground">
            {value} <span className="text-xs text-muted-foreground">{unit}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-muted/60 text-foreground hover:bg-accent/20 active:scale-95 transition-all cursor-pointer"
            aria-label={`Increase ${label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-primary cursor-pointer"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}

function BmiCalculator() {
  const [h, setH] = useState(175);
  const [w, setW] = useState(72);
  const bmi = +(w / ((h / 100) * (h / 100))).toFixed(1);
  const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const pct = Math.max(0, Math.min(100, ((bmi - 15) / (35 - 15)) * 100));

  const currentInfo = BMI_CATEGORIES[cat] || BMI_CATEGORIES.Normal;

  return (
    <div className="grid gap-8 rounded-3xl border border-border bg-card p-5 sm:p-8 md:p-12 shadow-sm md:grid-cols-2 min-w-0">
      <div className="min-w-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-foreground" /> Health check
        </div>
        <h3 className="mt-4 font-display text-3xl font-bold text-foreground sm:text-4xl">
          Quick <span className="text-gradient">BMI</span> Calculator
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Know your starting point. Adjust height and weight to see your Body Mass Index.
        </p>

        <div className="mt-8 space-y-6">
          <Range label="Height" value={h} min={120} max={220} unit="cm" onChange={setH} />
          <Range label="Weight" value={w} min={35} max={180} unit="kg" onChange={setW} />
        </div>
      </div>

      {/* Dynamic BMI Gauge Card with Category Background Images */}
      <div className="relative overflow-hidden grid place-items-center rounded-2xl border border-white/15 bg-zinc-950 p-6 sm:p-10 shadow-2xl min-w-0 min-h-[380px]">
        {/* State Background Images with smooth crossfade */}
        {Object.entries(BMI_CATEGORIES).map(([categoryName, info]) => {
          const isActive = cat === categoryName;
          return (
            <div
              key={categoryName}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={info.image}
                alt={categoryName}
                className="w-full h-full object-cover object-center"
              />
              {/* Semi-transparent dark overlay for text contrast while keeping photo vividly visible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/55" />
            </div>
          );
        })}

        {/* State Tag Badge */}
        <div className="absolute top-4 right-4 z-20 rounded-full border border-white/25 bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md shadow-lg">
          {cat}
        </div>

        {/* Gauge Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative grid h-48 w-48 sm:h-56 sm:w-56 place-items-center rounded-full border border-white/20 bg-black/70 backdrop-blur-md shadow-2xl">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(var(--color-white), var(--color-zinc-500) ${pct}%, transparent 0)`,
                mask: "radial-gradient(farthest-side, transparent 62%, black 63%)",
                WebkitMask: "radial-gradient(farthest-side, transparent 62%, black 63%)",
              }}
            />
            <div className="relative text-center">
              <div className="font-display text-5xl font-bold text-white tracking-tight drop-shadow-md">
                {bmi}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-300">
                BMI
              </div>
            </div>
          </div>

          <div className="mt-6 text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">
            {cat}
          </div>
          <p className="mt-1 text-xs font-semibold text-zinc-200 drop-shadow">
            {cat} range: {currentInfo.range}
          </p>
          <p className="mt-2 text-xs text-zinc-300 max-w-xs font-medium drop-shadow">
            {currentInfo.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

export function BmiSection() {
  return (
    <section
      id="bmi"
      className="mx-auto max-w-[100rem] px-4 sm:px-6 lg:px-8 pt-18 pb-10 sm:pt-20 sm:pb-12 md:pt-22 md:pb-14"
    >
      <Reveal className="min-w-0">
        <BmiCalculator />
      </Reveal>
    </section>
  );
}

export default BmiSection;
