/* eslint-disable max-lines */
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  Heart,
  FileCheck,
  Edit3,
  RotateCcw,
  Trash2,
  AlertCircle,
  Copy,
  Check,
  FileText,
  Dumbbell,
  Quote,
  Ruler,
  Scale,
  Shield,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

function calculateAge(dobString) {
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

function calculateBmi(heightCm, weightKg) {
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
  let advice = "Healthy weight range for general athletic training.";

  if (bmiNum < 18.5) {
    category = "Underweight";
    color = "text-amber-500 bg-amber-500/10 border-amber-500/25";
    barPercent = Math.min(Math.max((bmiNum / 18.5) * 25, 8), 25);
    barColor = "bg-amber-500";
    advice = "Nutritional surplus & progressive hypertrophy recommended.";
  } else if (bmiNum >= 18.5 && bmiNum < 25) {
    category = "Normal";
    color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/25";
    barPercent = 25 + ((bmiNum - 18.5) / 6.5) * 35;
    barColor = "bg-emerald-500";
    advice = "Optimal conditioning. Ready for high-intensity functional training.";
  } else if (bmiNum >= 25 && bmiNum < 30) {
    category = "Overweight";
    color = "text-amber-500 bg-amber-500/10 border-amber-500/25";
    barPercent = 60 + ((bmiNum - 25) / 5) * 25;
    barColor = "bg-amber-500";
    advice = "Targeted metabolic conditioning and caloric deficit advised.";
  } else {
    category = "Obese";
    color = "text-rose-500 bg-rose-500/10 border-rose-500/25";
    barPercent = Math.min(85 + ((bmiNum - 30) / 10) * 15, 98);
    barColor = "bg-rose-500";
    advice = "Low-impact endurance & physician-guided regimen advised.";
  }

  return { value: bmi, category, color, barPercent, barColor, advice };
}

function formatHeight(cm) {
  const c = parseFloat(cm);
  if (!c || isNaN(c)) return null;
  const totalInches = c / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}"`;
}

function formatWeight(kg) {
  const k = parseFloat(kg);
  if (!k || isNaN(k)) return null;
  const lbs = (k * 2.20462).toFixed(1);
  return `${lbs} lbs`;
}

export function MemberDetailsModal({ isOpen, onClose, member, onEdit, onSoftDelete, onRestore }) {
  const [activeTab, setActiveTab] = useState("vitals");
  const [copiedField, setCopiedField] = useState(null);

  if (!member) return null;

  const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member Profile";
  const initials = (member.firstName?.[0] || "") + (member.lastName?.[0] || "");
  const age = calculateAge(member.dob);
  const bmiInfo = calculateBmi(member.height, member.weight);
  const isDeleted = Boolean(member.isDeleted);
  const imperialHeight = formatHeight(member.height);
  const imperialWeight = formatWeight(member.weight);

  const handleCopy = (text, fieldName, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const tabs = [
    { id: "vitals", label: "Vitals & Health", icon: Dumbbell },
    { id: "contact", label: "Contact & Residence", icon: User },
    { id: "emergency", label: "Emergency & Docs", icon: Shield },
    { id: "bio", label: "Athlete Bio", icon: Quote },
  ];

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          aria-describedby="member-details-desc"
          className="no-scrollbar fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-3xl max-h-[92vh] translate-x-[-50%] translate-y-[-50%] flex flex-col rounded-3xl border border-border/80 bg-card/95 text-card-foreground shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none overflow-hidden"
        >
          {/* Top Decorative Gym Club Identity Banner */}
          <div className="relative border-b border-border/70 bg-gradient-to-r from-accent/20 via-background/80 to-accent/10 px-6 pt-7 pb-6 sm:px-8 shrink-0 overflow-hidden">
            {/* Ambient background glow orb */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              {/* Avatar + Member Details */}
              <div className="flex items-center gap-4.5 min-w-0">
                {/* Avatar with Status Ring */}
                <div className="relative shrink-0">
                  <div className="h-20 w-20 sm:h-22 sm:w-22 rounded-2xl border-2 border-border/80 bg-gradient-to-br from-card to-background p-1 shadow-lg">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={fullName}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center rounded-xl bg-accent/15 text-accent font-display text-2xl font-black tracking-wider uppercase">
                        {initials || "M"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Identity Text */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {/* Status Badge */}
                    {isDeleted ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-destructive">
                        Archived / Soft-Deleted
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                          member.status === "Inactive"
                            ? "bg-muted border border-border text-muted-foreground"
                            : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                        }`}
                      >
                        {member.status || "Active"} Member
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate font-display">
                    {fullName}
                  </h2>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-accent shrink-0" />
                      <span>
                        Enrolled:{" "}
                        <strong className="text-foreground font-medium">
                          {member.registeredAt
                            ? new Date(member.registeredAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "Recently"}
                        </strong>
                      </span>
                    </span>

                    {age !== null && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span>•</span>
                        <span>
                          <strong className="text-foreground font-medium">{age}</strong> yrs old
                        </span>
                      </span>
                    )}

                    {member.gender && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <span>•</span>
                        <span>{member.gender}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Quick Actions (Call & Email) */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                {member.mobile && (
                  <a
                    href={`tel:${member.mobile}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all shadow-sm cursor-pointer"
                    title={`Call ${member.mobile}`}
                  >
                    <Phone size={14} className="text-accent" />
                    <span className="hidden xs:inline">Call</span>
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all shadow-sm cursor-pointer"
                    title={`Email ${member.email}`}
                  >
                    <Mail size={14} className="text-accent" />
                    <span className="hidden xs:inline">Email</span>
                  </a>
                )}

                <DialogPrimitive.Close
                  onClick={onClose}
                  className="rounded-full border border-border/80 bg-background/60 p-2 text-muted-foreground hover:bg-accent/15 hover:text-foreground transition-colors cursor-pointer ml-1"
                  aria-label="Close"
                >
                  <X size={18} />
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* Segmented Tab Controls */}
            <div className="mt-6 flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl bg-muted/40 p-1 border border-border/60">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-card text-foreground shadow-sm border border-border/80 font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                    }`}
                  >
                    <Icon
                      size={14}
                      className={isActive ? "text-accent" : "text-muted-foreground"}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="no-scrollbar flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm">
            {/* TAB 1: VITALS & PHYSICAL HEALTH */}
            {activeTab === "vitals" && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* 4-Stat Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Height Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-background p-4 shadow-sm hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Height</span>
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
                        <Ruler size={15} />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <p className="text-2xl font-black text-foreground font-display">
                        {member.height ? `${member.height} ` : "—"}
                        {member.height && (
                          <span className="text-xs font-semibold text-muted-foreground">cm</span>
                        )}
                      </p>
                      {imperialHeight && (
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                          Approx. {imperialHeight}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Weight Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-background p-4 shadow-sm hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-bold uppercase tracking-wider">Weight</span>
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
                        <Scale size={15} />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <p className="text-2xl font-black text-foreground font-display">
                        {member.weight ? `${member.weight} ` : "—"}
                        {member.weight && (
                          <span className="text-xs font-semibold text-muted-foreground">kg</span>
                        )}
                      </p>
                      {imperialWeight && (
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                          Approx. {imperialWeight}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Age & Gender Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-background p-4 shadow-sm hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        Demographics
                      </span>
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
                        <User size={15} />
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <p className="text-2xl font-black text-foreground font-display">
                        {age !== null ? `${age} ` : "—"}
                        {age !== null && (
                          <span className="text-xs font-semibold text-muted-foreground">yrs</span>
                        )}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                        {member.gender || "Gender unspecified"}
                      </p>
                    </div>
                  </div>

                  {/* BMI Summary Card */}
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-background p-4 shadow-sm hover:border-accent/30 transition-colors">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        Body Mass Index
                      </span>
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
                        <Activity size={15} />
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-baseline justify-between gap-2">
                      <p className="text-2xl font-black text-foreground font-display">
                        {bmiInfo ? bmiInfo.value : "—"}
                      </p>
                      {bmiInfo && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${bmiInfo.color}`}
                        >
                          {bmiInfo.category}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                      {bmiInfo ? "Calculated BMI" : "Requires height & weight"}
                    </p>
                  </div>
                </div>

                {/* Interactive BMI Health Spectrum Gauge */}
                {bmiInfo && (
                  <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-background to-muted/20 p-5 sm:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-accent" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Body Composition Indicator
                        </h4>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        Current Score:{" "}
                        <strong className="text-foreground font-bold">{bmiInfo.value}</strong> (
                        {bmiInfo.category})
                      </span>
                    </div>

                    {/* Gauge Visual Bar */}
                    <div className="space-y-1.5">
                      <div className="relative h-3 w-full rounded-full bg-muted/70 overflow-hidden">
                        {/* Segment zones */}
                        <div className="absolute inset-0 flex">
                          <div className="w-[25%] bg-amber-500/30" title="Underweight (<18.5)" />
                          <div className="w-[35%] bg-emerald-500/40" title="Normal (18.5 - 24.9)" />
                          <div className="w-[25%] bg-amber-500/40" title="Overweight (25 - 29.9)" />
                          <div className="w-[15%] bg-rose-500/40" title="Obese (≥30)" />
                        </div>
                        {/* Active needle marker indicator */}
                        <div
                          className={`absolute top-0 bottom-0 w-2.5 rounded-full shadow-md ${bmiInfo.barColor} transition-all duration-500`}
                          style={{ left: `calc(${bmiInfo.barPercent}% - 5px)` }}
                        />
                      </div>

                      {/* Spectrum labels */}
                      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground px-0.5">
                        <span className="text-amber-500">Underweight (&lt;18.5)</span>
                        <span className="text-emerald-500">Normal (18.5-24.9)</span>
                        <span className="text-amber-500">Overweight (25-29.9)</span>
                        <span className="text-rose-500">Obese (30+)</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-background/50 p-3 text-xs text-muted-foreground">
                      <Activity size={15} className="text-accent shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{bmiInfo.advice}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CONTACT & RESIDENCE */}
            {activeTab === "contact" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Tile */}
                  <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-background p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                        <Phone size={15} />
                        <span>Primary Mobile</span>
                      </div>
                      {member.mobile && (
                        <button
                          type="button"
                          onClick={() => handleCopy(member.mobile, "mobile", "Phone number")}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {copiedField === "mobile" ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-base font-bold text-foreground font-mono">
                      {member.mobile || "No mobile provided"}
                    </p>
                    {member.mobile && (
                      <a
                        href={`tel:${member.mobile}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        <span>Direct Dial via Phone</span>
                        <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>

                  {/* Email Tile */}
                  <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-background p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                        <Mail size={15} />
                        <span>Email Address</span>
                      </div>
                      {member.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(member.email, "email", "Email")}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          {copiedField === "email" ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-base font-bold text-foreground truncate">
                      {member.email || "No email provided"}
                    </p>
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline cursor-pointer"
                      >
                        <span>Send Official Email</span>
                        <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Residential Address Tile */}
                <div className="rounded-2xl border border-border bg-gradient-to-b from-card to-background p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                      <MapPin size={15} />
                      <span>Permanent Residential Address</span>
                    </div>
                    {member.address && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `${member.address}, ${member.city}, ${member.state}, ${member.country} - ${member.pincode}`,
                            "address",
                            "Full address",
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {copiedField === "address" ? (
                          <>
                            <Check size={12} className="text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Address</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <p className="text-sm text-foreground font-medium leading-relaxed">
                      {member.address ? (
                        <>
                          <span className="block text-foreground font-semibold">
                            {member.address}
                          </span>
                          <span className="text-muted-foreground mt-1 block">
                            {member.city}, {member.state}, {member.country} —{" "}
                            <span className="font-mono font-bold text-foreground">
                              {member.pincode}
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No residential address registered.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EMERGENCY & DOCUMENTS */}
            {activeTab === "emergency" && (
              <div className="space-y-5 animate-in fade-in-50 duration-200">
                {/* Emergency Contact Card */}
                <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-background p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                      <Heart size={16} className="text-rose-500" />
                      <span>Primary Emergency Contact</span>
                    </div>
                    {member.emergencyNumber && (
                      <a
                        href={`tel:${member.emergencyNumber}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                      >
                        <Phone size={13} />
                        <span>Emergency Call</span>
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Contact Person
                      </span>
                      <p className="text-sm font-bold text-foreground mt-1">
                        {member.emergencyName || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Relationship
                      </span>
                      <p className="text-sm font-bold text-foreground mt-1">
                        {member.emergencyRelationship ? (
                          <span className="inline-block rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                            {member.emergencyRelationship}
                          </span>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                        Emergency Phone
                      </span>
                      <p className="text-sm font-bold text-foreground font-mono mt-1">
                        {member.emergencyNumber || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Clearance Document Card */}
                <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-background p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                      <FileCheck size={16} className="text-emerald-500" />
                      <span>Physician Clearance Document</span>
                    </div>
                  </div>

                  {member.medicalDoc || member.medicalDocName ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          <FileText size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {member.medicalDocName || "Medical_Fitness_Certificate.pdf"}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{member.medicalDocSize || "Attached PDF"}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                              <Check size={12} /> Verified Fitness Clearance
                            </span>
                          </div>
                        </div>
                      </div>

                      {member.medicalDoc && (
                        <a
                          href={member.medicalDoc}
                          download={member.medicalDocName || "Medical_Certificate"}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 transition-all shrink-0 cursor-pointer"
                        >
                          <FileCheck size={14} />
                          <span>Download Certificate</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-border bg-background/40">
                      <AlertCircle size={28} className="text-muted-foreground/60 mb-2" />
                      <p className="text-xs font-bold text-foreground">
                        No Medical Document Uploaded
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1 max-w-sm">
                        Member has not submitted a physician medical clearance form yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: ATHLETE BIO & GOALS */}
            {activeTab === "bio" && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="relative rounded-3xl border border-border bg-gradient-to-b from-card to-background p-6 sm:p-8 shadow-sm">
                  <div className="absolute top-6 right-6 text-accent/15 pointer-events-none">
                    <Quote size={52} />
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-4">
                    <Quote size={15} />
                    <span>Personal Bio & Fitness Objectives</span>
                  </div>

                  {member.bio ? (
                    <div className="relative rounded-2xl border border-border/70 bg-background/70 p-5 sm:p-6">
                      <p className="text-sm sm:text-base text-foreground leading-relaxed italic font-serif">
                        &ldquo;{member.bio}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-xs italic">
                      No personal bio or fitness notes recorded for this member.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Luxury Floating Modal Footer */}
          <div className="border-t border-border/70 bg-card/90 px-6 py-4.5 sm:px-8 shrink-0 flex items-center justify-between gap-3 backdrop-blur-md">
            <div>
              {isDeleted ? (
                <button
                  type="button"
                  onClick={() => {
                    onRestore?.(member.id);
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                >
                  <RotateCcw size={15} />
                  <span>Restore Member Record</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSoftDelete?.(member.id, fullName);
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-all cursor-pointer shadow-sm"
                >
                  <Trash2 size={15} />
                  <span>Archive (Soft Delete)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border bg-background px-4.5 py-2.5 text-xs font-bold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
              >
                Close
              </button>
              {!isDeleted && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit?.(member);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default MemberDetailsModal;
