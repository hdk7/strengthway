/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Sparkles,
  Shield,
  FileCheck,
  Download,
  Copy,
  Check,
  Dumbbell,
  Quote,
  Flame,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Activity,
  Heart,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getMemberById,
  updateMember,
  softDeleteMember,
  restoreMember,
  convertLeadToMember,
} from "@/lib/membersService";
import { AdminMemberRegistrationModal } from "./MembersRegistration";

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
      "Physician-guided low-impact training, joint-friendly cardio, and strict nutritional guidance advised.";
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

export default function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const data = getMemberById(id);
    setMember(data);
    setIsLoading(false);
  }, [id]);

  const fullName = useMemo(() => {
    if (!member) return "";
    return `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Member Profile";
  }, [member]);

  const initials = useMemo(() => {
    if (!member) return "M";
    return `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase() || "M";
  }, [member]);

  const age = useMemo(() => calculateAge(member?.dob), [member?.dob]);
  const bmiInfo = useMemo(
    () => calculateBmi(member?.height, member?.weight),
    [member?.height, member?.weight],
  );
  const imperialHeight = useMemo(() => formatHeight(member?.height), [member?.height]);
  const imperialWeight = useMemo(() => formatWeight(member?.weight), [member?.weight]);
  const isDeleted = Boolean(member?.isDeleted);

  const handleCopy = (text, fieldKey, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveEdit = (formData) => {
    try {
      const updated = updateMember(member.id, formData);
      if (updated) {
        setMember(updated);
        toast.success("Member profile updated successfully.");
      }
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const handleSoftDelete = () => {
    if (!window.confirm(`Are you sure you want to archive ${fullName}?`)) return;
    try {
      const archived = softDeleteMember(member.id);
      if (archived) {
        setMember(archived);
        toast.success(`${fullName} has been archived.`);
      }
    } catch {
      toast.error("Failed to archive member.");
    }
  };

  const handleRestore = () => {
    try {
      const restored = restoreMember(member.id);
      if (restored) {
        setMember(restored);
        toast.success(`${fullName} restored to active members.`);
      }
    } catch {
      toast.error("Failed to restore member.");
    }
  };

  const handleConvertLead = () => {
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
        <p className="mt-3 text-sm">Loading member profile…</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-bold text-foreground">Member Not Found</h2>
        <p className="text-sm text-muted-foreground">
          No gym member record exists with ID <strong className="text-foreground">{id}</strong>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/trainers-members/members")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Members Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Breadcrumb Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={12} />
          <Link
            to="/admin/trainers-members/members"
            className="hover:text-foreground transition-colors"
          >
            Members
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-semibold">{fullName}</span>
        </div>

        {/* Back & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/admin/trainers-members/members")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Members List</span>
          </button>

          {!isDeleted && member.status === "Lead" && (
            <button
              type="button"
              onClick={handleConvertLead}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserCheck size={14} />
              <span>Confirm & Convert to Member</span>
            </button>
          )}

          {isDeleted ? (
            <button
              type="button"
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 transition-all shadow-sm cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Restore Member</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSoftDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all shadow-sm cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Archive (Soft Delete)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Lead Notice Banner if applicable */}
      {!isDeleted && member.status === "Lead" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-500">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Prospective Lead Registration</h3>
              <p className="text-xs text-muted-foreground">
                This athlete is a registered lead. Confirm this lead to officially activate their
                gym membership.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConvertLead}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserCheck size={14} />
            <span>Confirm Member Now</span>
          </button>
        </div>
      )}

      {/* Hero Athletic Pass Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-accent/20 via-card to-background p-6 sm:p-8 shadow-sm">
        {/* Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Identity Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar with live status ring */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-border/80 bg-gradient-to-br from-card to-background p-1 shadow-xl">
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={fullName}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center rounded-xl bg-accent/15 text-accent font-display text-3xl font-black tracking-wider uppercase">
                    {initials}
                  </div>
                )}
              </div>
            </div>

            {/* Name, ID, Badges */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Badge */}
                {isDeleted ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-destructive">
                    Archived / Soft-Deleted
                  </span>
                ) : member.status === "Lead" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-500">
                    Prospective Lead
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      member.status === "Inactive"
                        ? "bg-muted border border-border text-muted-foreground"
                        : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                    }`}
                  >
                    {member.status || "Active"} Member
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground font-display">
                {fullName}
              </h1>

              {/* Subtitle Details */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
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
                  <span className="flex items-center gap-1">
                    <span>•</span>
                    <span>
                      <strong className="text-foreground font-medium">{age}</strong> yrs old
                    </span>
                  </span>
                )}

                {member.gender && (
                  <span className="flex items-center gap-1">
                    <span>•</span>
                    <span>{member.gender}</span>
                  </span>
                )}

                {member.city && (
                  <span className="hidden sm:flex items-center gap-1">
                    <span>•</span>
                    <MapPin size={12} className="text-accent" />
                    <span>{member.city}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Direct Quick Action Contact Group */}
          <div className="flex items-center gap-3 flex-wrap self-start md:self-center shrink-0">
            {member.mobile && (
              <a
                href={`tel:${member.mobile}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all shadow-sm cursor-pointer"
              >
                <Phone size={14} className="text-accent" />
                <span>Call {member.mobile}</span>
              </a>
            )}

            {member.email && (
              <a
                href={`mailto:${member.email}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all shadow-sm cursor-pointer"
              >
                <Mail size={14} className="text-accent" />
                <span>Send Email</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vitals, BMI Spectrum, Bio, Documents (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Physical Stats Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Height Card */}
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
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
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
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
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
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
            <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
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

          {/* Interactive BMI & Body Composition Spectrum Bar */}
          {bmiInfo && (
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity size={16} className="text-accent" />
                    <span>Body Composition Spectrum Analysis</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Calculated using standard athletic body mass index ratio
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Evaluated Score:</span>
                  <span className="text-sm font-black text-foreground">{bmiInfo.value}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${bmiInfo.color}`}
                  >
                    {bmiInfo.category}
                  </span>
                </div>
              </div>

              {/* Spectrum Gradient Track */}
              <div className="space-y-2 pt-2">
                <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-emerald-500 via-50% to-rose-500 opacity-80" />
                  <div
                    className="absolute top-0 bottom-0 w-2.5 bg-white border-2 border-black rounded-full shadow-[0_0_8px_rgba(0,0,0,0.8)] -translate-x-1/2 transition-all duration-500"
                    style={{ left: `${bmiInfo.barPercent}%` }}
                    title={`BMI: ${bmiInfo.value} (${bmiInfo.category})`}
                  />
                </div>

                {/* Range Labels */}
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-1">
                  <span>Underweight (&lt;18.5)</span>
                  <span className="text-emerald-500 font-semibold">Normal (18.5–24.9)</span>
                  <span>Overweight (25–29.9)</span>
                  <span>Obese (30+)</span>
                </div>
              </div>

              {/* Athletic Guidance Box */}
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-foreground/90 flex items-start gap-3">
                <Sparkles size={18} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-accent block mb-0.5">
                    Athletic Training Directive:
                  </strong>
                  <span>{bmiInfo.advice}</span>
                </div>
              </div>
            </div>
          )}

          {/* Athlete Bio & Fitness Philosophy */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Quote size={18} className="text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Athlete Fitness Profile & Background
              </h3>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/50 p-5">
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-serif italic">
                &ldquo;Active club member pursuing functional strength progression, regular
                endurance sessions, and overall athletic longevity with consistent gym
                attendance.&rdquo;
              </p>
            </div>

            {/* Core Training Focus Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "Progressive Resistance",
                "Metabolic Conditioning",
                "Mobility & Flexibility",
                "Nutrition Discipline",
                "Form Optimization",
              ].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground/90"
                >
                  <Flame size={12} className="text-accent" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Medical Fitness Clearance Document */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck size={18} className="text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Medical Clearance & Physical Certificate
                </h3>
              </div>
              {member.medicalDoc || member.medicalDocName ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-500">
                  <Check size={12} />
                  <span>Verified On File</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Not uploaded</span>
              )}
            </div>

            {member.medicalDoc || member.medicalDocName ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background p-4.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                    <FileCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {member.medicalDocName ||
                        member.medicalDoc ||
                        "Medical_Fitness_Certificate.pdf"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {member.medicalDocSize || "1.4 MB"} • Signed Physician Clearance
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toast.success("Opening document preview…")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/10 transition-colors cursor-pointer"
                  >
                    <ExternalLink size={13} />
                    <span>View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success("Downloading medical certificate…")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent/15 text-accent border border-accent/30 px-3 py-1.5 text-xs font-semibold hover:bg-accent/25 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/20 p-5 text-center text-xs text-muted-foreground">
                <p>No physician clearance file currently uploaded for this member.</p>
                <p className="mt-1">
                  Admins can attach PDF medical certificates via the{" "}
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-accent underline font-medium hover:text-accent/80 cursor-pointer"
                  >
                    Edit Profile
                  </button>{" "}
                  window.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact, Address, Emergency Contact, Account Dossier (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Direct Contact Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
              Contact Channels
            </h3>

            {/* Phone */}
            <div className="group rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1 transition-all hover:border-accent/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone size={13} className="text-accent" />
                  <span>Mobile Phone</span>
                </span>
                {member.mobile && (
                  <button
                    type="button"
                    onClick={() => handleCopy(member.mobile, "mobile", "Mobile number")}
                    className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy phone"
                  >
                    {copiedField === "mobile" ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-foreground font-mono tracking-tight pt-1">
                {member.mobile || "Not provided"}
              </p>
              {member.mobile && (
                <a
                  href={`tel:${member.mobile}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline pt-1"
                >
                  <span>Click to call</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Email */}
            <div className="group rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1 transition-all hover:border-accent/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail size={13} className="text-accent" />
                  <span>Email Address</span>
                </span>
                {member.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(member.email, "email", "Email address")}
                    className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy email"
                  >
                    {copiedField === "email" ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-foreground break-all pt-1">
                {member.email || "Not provided"}
              </p>
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline pt-1"
                >
                  <span>Click to compose</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>

            {/* Date of Birth */}
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar size={13} className="text-accent" />
                <span>Date of Birth</span>
              </span>
              <p className="text-sm font-bold text-foreground font-mono pt-1">
                {member.dob || "—"}
              </p>
              {age !== null && (
                <p className="text-[11px] text-muted-foreground">
                  Verified Age: {age} Years (Eligible Adult Member)
                </p>
              )}
            </div>
          </div>

          {/* Residential Address Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <MapPin size={14} />
              <span>Residential Address</span>
            </h3>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs space-y-2 text-foreground">
              {member.address ? (
                <>
                  <p className="font-semibold text-sm leading-relaxed">{member.address}</p>
                  <div className="flex flex-wrap gap-2 text-muted-foreground pt-1">
                    {member.city && (
                      <span className="rounded-md bg-card px-2 py-0.5 border border-border font-medium text-foreground">
                        {member.city}
                      </span>
                    )}
                    {member.state && (
                      <span className="rounded-md bg-card px-2 py-0.5 border border-border font-medium text-foreground">
                        {member.state}
                      </span>
                    )}
                    {member.pincode && (
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 border border-accent/25 font-mono font-bold text-accent">
                        PIN: {member.pincode}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Country: {member.country || "India"}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">No address recorded.</p>
              )}
            </div>
          </div>

          {/* Emergency Contact Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <Shield size={14} />
              <span>Emergency Contact</span>
            </h3>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs space-y-2">
              {member.emergencyName ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {member.emergencyName}
                    </span>
                    {member.emergencyRelationship && (
                      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/25">
                        {member.emergencyRelationship}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-mono text-xs text-foreground font-semibold">
                      {member.emergencyNumber || "—"}
                    </span>
                    {member.emergencyNumber && (
                      <a
                        href={`tel:${member.emergencyNumber}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 border border-rose-500/25 px-2.5 py-1 text-[11px] font-bold text-rose-500 hover:bg-rose-500/20 transition-colors"
                      >
                        <Phone size={11} />
                        <span>Emergency Call</span>
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No emergency contact recorded.</p>
              )}
            </div>
          </div>

          {/* Active Membership & Billing Card if enrolled */}
          {member.membershipPlan && (
            <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Award size={14} />
                  <span>Enrolled Membership Plan</span>
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                  {member.membershipPlan.name}
                </span>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan Duration</span>
                  <span className="font-semibold text-foreground">
                    {member.membershipPlan.durationMonths} Month
                    {member.membershipPlan.durationMonths > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Validity Window</span>
                  <span className="font-semibold text-foreground">
                    {member.membershipPlan.formattedStart} — {member.membershipPlan.formattedEnd}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subscription Fee</span>
                  <span className="font-bold text-accent">
                    {member.membershipPlan.formattedPrice}
                  </span>
                </div>

                {member.paymentDetails && (
                  <>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium text-foreground">
                        {member.paymentDetails.method}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Txn Reference</span>
                      <span className="font-mono text-[11px] text-foreground">
                        {member.paymentDetails.transactionId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Receipt Number</span>
                      <span className="font-mono text-[11px] text-emerald-500 font-bold">
                        {member.paymentDetails.receiptNo}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Payment Status</span>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                        {member.paymentDetails.status}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Account & Facility Summary */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
              Membership Account Dossier
            </h3>

            <div className="space-y-2 divide-y divide-border/40">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">System Record ID</span>
                <span className="font-mono font-bold text-foreground">{member.id}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Enrolled Date</span>
                <span className="font-medium text-foreground">
                  {member.registeredAt
                    ? new Date(member.registeredAt).toLocaleDateString("en-IN")
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Facility Access</span>
                <span className="font-semibold text-emerald-500">Full Gym Floor & Equipment</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Record Status</span>
                <span className="font-bold text-foreground">
                  {isDeleted ? "Archived" : member.status || "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Edit / Confirm Registration Modal */}
      <AdminMemberRegistrationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSaveEdit}
        memberToEdit={member}
      />
    </div>
  );
}
