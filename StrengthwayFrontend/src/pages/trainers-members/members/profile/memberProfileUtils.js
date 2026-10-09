export function calculateAge(dobString) {
  if (!dobString) return null;
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateBmi(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  const heightM = h / 100;
  const bmiNum = w / (heightM * heightM);
  const bmi = bmiNum.toFixed(1);

  let category = "Normal";
  let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/25";
  let barPercent = 50;
  let barColor = "bg-emerald-500";
  let advice =
    "Optimal athletic conditioning. Ready for high-intensity functional training and hypertrophy periodization.";

  if (bmiNum < 18.5) {
    category = "Underweight";
    color = "text-amber-500 bg-amber-500/10 border-amber-500/25";
    barPercent = Math.min(Math.max((bmiNum / 18.5) * 25, 8), 25);
    barColor = "bg-amber-500";
    advice =
      "Caloric surplus and progressive resistance training advised to build functional lean mass.";
  } else if (bmiNum >= 18.5 && bmiNum < 25) {
    category = "Normal";
    color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/25";
    barPercent = 25 + ((bmiNum - 18.5) / 6.5) * 35;
    barColor = "bg-emerald-500";
    advice =
      "Optimal conditioning. Ideal for high-intensity functional training, barbell lifts, and endurance splits.";
  } else if (bmiNum >= 25 && bmiNum < 30) {
    category = "Overweight";
    color = "text-amber-500 bg-amber-500/10 border-amber-500/25";
    barPercent = 60 + ((bmiNum - 25) / 5) * 25;
    barColor = "bg-amber-500";
    advice =
      "Targeted metabolic conditioning, caloric control, and cardio interval splits recommended.";
  } else {
    category = "Obese";
    color = "text-rose-500 bg-rose-500/10 border-rose-500/25";
    barPercent = Math.min(85 + ((bmiNum - 30) / 10) * 15, 98);
    barColor = "bg-rose-500";
    advice =
      "Supervised metabolic workouts, joint-friendly cardio, and comprehensive nutritional intervention required.";
  }

  return {
    value: bmi,
    category,
    color,
    barPercent,
    barColor,
    advice,
  };
}

export function formatHeight(cm) {
  const c = parseFloat(cm);
  if (!c || isNaN(c)) return null;
  const totalInches = c / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}"`;
}

export function formatWeight(kg) {
  const k = parseFloat(kg);
  if (!k || isNaN(k)) return null;
  const lbs = (k * 2.20462).toFixed(1);
  return `${lbs} lbs`;
}
