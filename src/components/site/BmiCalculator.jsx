import { useState } from "react";
import { Activity, Minus, Plus } from "lucide-react";

export function BmiCalculator() {
  const [h, setH] = useState(175);
  const [w, setW] = useState(72);
  const bmi = +(w / ((h / 100) * (h / 100))).toFixed(1);
  const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
  const pct = Math.max(0, Math.min(100, ((bmi - 15) / (35 - 15)) * 100));

  return (
    <div className="grid gap-8 rounded-3xl border border-border bg-black p-8 backdrop-blur-sm md:grid-cols-2 md:p-12">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider text-white/70">
          <Activity className="h-3.5 w-3.5 text-white" /> Health check
        </div>
        <h3 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
          Quick{" "}
          <span className="bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
            BMI
          </span>{" "}
          Calculator
        </h3>
        <p className="mt-2 text-sm text-white/60">
          Know your starting point. Adjust height and weight to see your Body Mass Index.
        </p>

        <div className="mt-8 space-y-6">
          <Range label="Height" value={h} min={120} max={220} unit="cm" onChange={setH} />
          <Range label="Weight" value={w} min={35} max={180} unit="kg" onChange={setW} />
        </div>
      </div>

      <div className="grid place-items-center rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="relative grid h-56 w-56 place-items-center rounded-full border border-zinc-800/80 bg-zinc-950/40">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(var(--color-white), var(--color-zinc-500) ${pct}%, transparent 0)`,
              mask: "radial-gradient(farthest-side, transparent 62%, black 63%)",
              WebkitMask: "radial-gradient(farthest-side, transparent 62%, black 63%)",
            }}
          />
          <div className="relative text-center">
            <div className="font-display text-5xl font-bold text-white">{bmi}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              BMI
            </div>
          </div>
        </div>
        <div className="mt-6 text-xl font-bold tracking-tight text-white">{cat}</div>
        <p className="mt-1 text-xs font-medium text-zinc-400">Normal range: 18.5 – 24.9</p>
      </div>
    </div>
  );
}

function Range({ label, value, min, max, unit, onChange }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm text-white/60">{label}</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
            aria-label={`Decrease ${label}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[4rem] text-right font-display text-lg font-bold text-white">
            {value} <span className="text-xs text-white/50">{unit}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
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
        className="w-full accent-white"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}
