import { Activity, Dumbbell, UserCheck, Heart } from "lucide-react";
import { MemberMedicalClearanceCard } from "./MemberMedicalClearanceCard";

export function MemberVitalsCard({
  member,
  imperialHeight,
  imperialWeight,
  age,
  bmiInfo,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Height Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-accent/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Height
          </span>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
            <Activity size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-foreground">
            {member.height ? `${member.height} cm` : "—"}
          </span>
          {imperialHeight && (
            <p className="text-xs text-muted-foreground mt-0.5">Approx. {imperialHeight}</p>
          )}
        </div>
      </div>

      {/* Weight Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-accent/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Weight
          </span>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
            <Dumbbell size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-foreground">
            {member.weight ? `${member.weight} kg` : "—"}
          </span>
          {imperialWeight && (
            <p className="text-xs text-muted-foreground mt-0.5">Approx. {imperialWeight}</p>
          )}
        </div>
      </div>

      {/* Demographics Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-accent/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Age / Gender
          </span>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
            <UserCheck size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-foreground">
            {age !== null ? `${age} yrs` : "—"}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {member.gender || "Not specified"}
          </p>
        </div>
      </div>

      {/* BMI Score Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-accent/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            BMI Score
          </span>
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
            <Heart size={16} />
          </div>
        </div>
        <div className="mt-3">
          <span className="text-2xl font-black text-foreground">
            {bmiInfo ? bmiInfo.value : "—"}
          </span>
          {bmiInfo ? (
            <span
              className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${bmiInfo.color}`}
            >
              {bmiInfo.category}
            </span>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">Awaiting height/weight</p>
          )}
        </div>
      </div>
    </div>
  );
}

export { MemberMedicalClearanceCard };
