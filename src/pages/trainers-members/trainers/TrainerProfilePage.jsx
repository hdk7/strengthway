/* eslint-disable max-lines */
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Award,
  Sparkles,
  ShieldCheck,
  Quote,
  Calendar,
  UserCheck,
  Sun,
  Moon,
  Clock,
  Dumbbell,
  Flame,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTrainerById,
  updateTrainer,
  deleteTrainer,
  toggleTrainerStatus,
} from "@/lib/trainersService";
import { TrainerModal } from "./TrainerModal";

function getShiftDetails(shiftString = "") {
  const shiftLower = (shiftString || "").toLowerCase();
  if (shiftLower.includes("morning")) {
    return {
      title: "Morning Shift",
      hours: "06:00 AM – 02:00 PM",
      icon: Sun,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      accentDot: "bg-amber-500",
      badge: "Early Prime Time",
      description:
        "Supervises early morning athletes, functional warmups, and peak breakfast training slots.",
    };
  }
  if (shiftLower.includes("evening")) {
    return {
      title: "Evening Shift",
      hours: "02:00 PM – 10:00 PM",
      icon: Moon,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      accentDot: "bg-indigo-400",
      badge: "Peak Gym Hours",
      description:
        "Leads evening strength conditioning, barbell mechanics, and high-intensity power sessions.",
    };
  }
  return {
    title: "General Shift",
    hours: "08:00 AM – 05:00 PM",
    icon: Clock,
    color: "text-accent bg-accent/10 border-accent/20",
    accentDot: "bg-accent",
    badge: "Full Day Access",
    description:
      "Oversees general floor training, member technique evaluations, and specialized workshops.",
  };
}

export default function TrainerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const data = getTrainerById(id);
    setTrainer(data);
    setIsLoading(false);
  }, [id]);

  const initials = useMemo(() => {
    if (!trainer?.name) return "T";
    return trainer.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [trainer?.name]);

  const shiftInfo = useMemo(() => getShiftDetails(trainer?.shift), [trainer?.shift]);
  const ShiftIcon = shiftInfo.icon;
  const isInactive = trainer?.status === "Inactive";

  const handleCopy = (text, fieldKey, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveEdit = (formData) => {
    try {
      const updated = updateTrainer(trainer.id, formData);
      if (updated) {
        setTrainer(updated);
        toast.success("Trainer profile updated successfully.");
      }
    } catch {
      toast.error("Failed to update Trainer.");
    }
  };

  const handleDelete = () => {
    if (
      !window.confirm(`Are you sure you want to remove ${trainer.name} from the Trainering roster?`)
    )
      return;
    try {
      deleteTrainer(trainer.id);
      toast.success(`${trainer.name} has been removed.`);
      navigate("/admin/trainers-members/trainers");
    } catch {
      toast.error("Failed to delete trainer.");
    }
  };

  const handleToggleStatus = () => {
    try {
      const updated = toggleTrainerStatus(trainer.id);
      if (updated) {
        setTrainer(updated);
        toast.success(`Status changed to ${updated.status}.`);
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
        <p className="mt-3 text-sm">Loading Trainer profile…</p>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-bold text-foreground">Trainer Not Found</h2>
        <p className="text-sm text-muted-foreground">
          No gym Trainer record exists with ID <strong className="text-foreground">{id}</strong>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/trainers-members/trainers")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Traineres Directory</span>
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
            to="/admin/trainers-members/trainers"
            className="hover:text-foreground transition-colors"
          >
            Trainers & Traineres
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-semibold">{trainer.name}</span>
        </div>

        {/* Back & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/admin/trainers-members/trainers")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Traineres List</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete Trainer</span>
          </button>

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

      {/* Hero Master Trainer Credential Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-r from-accent/20 via-card to-background p-6 sm:p-8 shadow-sm">
        {/* Ambient Glowing Orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-10 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Trainer Identity Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar with status ring */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-border/80 bg-gradient-to-br from-card to-background p-1 shadow-xl">
                {trainer.photo ? (
                  <img
                    src={trainer.photo}
                    alt={trainer.name}
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
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  title="Click to toggle status"
                  className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:scale-105 ${
                    isInactive
                      ? "bg-muted border border-border text-muted-foreground"
                      : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-500"
                  }`}
                >
                  {trainer.status || "Active"} Trainer
                </button>

                {/* Shift Badge */}
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${shiftInfo.color}`}
                >
                  <ShiftIcon size={12} />
                  <span>{shiftInfo.title}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground font-display">
                {trainer.name}
              </h1>

              {/* Subtitle Details */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-0.5">
                <span className="flex items-center gap-1 text-foreground font-semibold">
                  <Award size={13} className="text-accent shrink-0" />
                  <span>{trainer.specialization}</span>
                </span>

                <span className="flex items-center gap-1">
                  <span>•</span>
                  <Sparkles size={13} className="text-accent shrink-0" />
                  <span>{trainer.experience} Professional Experience</span>
                </span>

                {trainer.joinedAt && (
                  <span className="hidden sm:flex items-center gap-1 text-muted-foreground">
                    <span>•</span>
                    <Calendar size={13} className="text-muted-foreground shrink-0" />
                    <span>
                      Faculty Member Since{" "}
                      {new Date(trainer.joinedAt).toLocaleDateString("en-IN", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Direct Quick Action Contact Group */}
          <div className="flex items-center gap-3 flex-wrap self-start md:self-center shrink-0">
            {trainer.phone && (
              <a
                href={`tel:${trainer.phone}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/80 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-all shadow-sm cursor-pointer"
              >
                <Phone size={14} className="text-accent" />
                <span>Call Trainer</span>
              </a>
            )}

            {trainer.email && (
              <a
                href={`mailto:${trainer.email}`}
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
        {/* Left Column: Shift Schedule, Competencies, Methodologies, Bio (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Shift Schedule & Floor Duty Role Card */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card to-background p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent border border-accent/25">
                  <ShiftIcon size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{shiftInfo.title}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${shiftInfo.color}`}
                    >
                      {shiftInfo.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground flex items-center gap-2">
                    <Clock size={15} className="text-accent shrink-0" />
                    <span className="font-mono font-bold">{trainer.shift || shiftInfo.hours}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">{shiftInfo.description}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-left sm:text-right shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Floor Duty Assignment
                </span>
                <span className="text-xs font-bold text-emerald-500 flex items-center sm:justify-end mt-1">
                  On-Site Supervising Trainer
                </span>
              </div>
            </div>
          </div>

          {/* Trainering Competencies & Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Discipline Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Primary Specialization
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Award size={16} />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{trainer.specialization}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lead Trainer for Form Correction & Periodized Hypertrophy
                </p>
              </div>
            </div>

            {/* Experience Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trainering Experience
                </span>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/10 text-accent">
                  <Sparkles size={16} />
                </div>
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{trainer.experience}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Verified Gym Track Record & Athlete Transformations
                </p>
              </div>
            </div>
          </div>

          {/* Core Methodologies & Training Focus */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Dumbbell size={18} className="text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Core Methodologies & Training Focus
              </h3>
            </div>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                "Progressive Overload",
                "Barbell Biomechanics",
                "Functional Mobility & Warmup",
                "Hypertrophy Periodization",
                "Aerobic & Anaerobic Conditioning",
                "Injury Rehabilitation & Form",
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

          {/* Verified Staff Qualifications & Accreditations */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Verified Faculty Credentials & Certifications
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <UserCheck size={22} className="text-accent shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Certified Trainer</p>
                  <p className="text-[11px] text-muted-foreground">Level 2+ Accredited</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <ShieldCheck size={22} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">CPR / AED Certified</p>
                  <p className="text-[11px] text-muted-foreground">First Aid Qualified</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <Award size={22} className="text-accent shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Floor Supervisor</p>
                  <p className="text-[11px] text-muted-foreground">Safety Auditor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Biography & Philosophy Quote Box */}
          <div className="relative rounded-3xl border border-border/80 bg-gradient-to-br from-card to-background p-6 sm:p-8 shadow-sm overflow-hidden">
            <div className="absolute right-6 top-6 text-accent/10 pointer-events-none">
              <Quote size={96} />
            </div>

            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <Quote size={18} className="text-accent" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Trainering Philosophy & Athlete Background
                </h3>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/50 p-5 sm:p-6">
                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-serif italic">
                  &ldquo;
                  {trainer.bio ||
                    "Dedicated fitness mentor committed to safe progression, disciplined work ethics, and sustainable athletic transformation for gym members of all experience levels."}
                  &rdquo;
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  — {trainer.name}, {trainer.specialization}
                </span>
                <span className="font-mono text-[11px] text-accent">
                  The Strength Way Trainering Faculty
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact, Shift Department, Administrative Dossier (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Direct Contact Channels */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
              Official Trainer Contact
            </h3>

            {/* Phone */}
            <div className="group rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1 transition-all hover:border-accent/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Phone size={13} className="text-accent" />
                  <span>Direct Line</span>
                </span>
                {trainer.phone && (
                  <button
                    type="button"
                    onClick={() => handleCopy(trainer.phone, "phone", "Phone number")}
                    className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Copy phone"
                  >
                    {copiedField === "phone" ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                )}
              </div>
              <p className="text-sm font-bold text-foreground font-mono tracking-tight pt-1">
                {trainer.phone || "Not registered"}
              </p>
              {trainer.phone && (
                <a
                  href={`tel:${trainer.phone}`}
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
                  <span>Staff Email</span>
                </span>
                {trainer.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy(trainer.email, "email", "Email address")}
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
                {trainer.email || "Not registered"}
              </p>
              {trainer.email && (
                <a
                  href={`mailto:${trainer.email}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline pt-1"
                >
                  <span>Click to compose</span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>

          {/* Department & Facility Assignment */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
              Facility & Floor Assignment
            </h3>

            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs space-y-2 text-foreground">
              <p className="font-bold text-sm">The Strength Way — Floor & Conditioning Division</p>
              <p className="text-muted-foreground">
                Main Athletic Arena, Resistance Periodization Zone, and Functional Mobility Floor.
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-border/40 text-[11px] text-muted-foreground">
                <span>Roster Classification:</span>
                <span className="font-semibold text-foreground">Active Staff Trainer</span>
              </div>
            </div>
          </div>

          {/* Trainer Administrative Dossier */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent">
              Trainer Profile Dossier
            </h3>

            <div className="space-y-2 divide-y divide-border/40">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">System Trainer ID</span>
                <span className="font-mono font-bold text-foreground">{trainer.id}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Shift Schedule</span>
                <span className="font-medium text-foreground">{trainer.shift || "Morning"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Faculty Status</span>
                <span className="font-bold text-emerald-500">{trainer.status || "Active"}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Joined At</span>
                <span className="font-medium text-foreground">
                  {trainer.joinedAt ? new Date(trainer.joinedAt).toLocaleDateString("en-IN") : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Trainer Modal */}
      <TrainerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSaveEdit}
        trainerToEdit={trainer}
      />
    </div>
  );
}
