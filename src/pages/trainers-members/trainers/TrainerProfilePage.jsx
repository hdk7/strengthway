/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  AlertCircle,
  Quote,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Repeat,
  Layers,
  TrendingUp,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTrainerById,
  getTrainerPhoto,
  updateTrainer,
  deleteTrainer,
  getTrainerMonthTracking,
} from "@/lib/trainersService";
import { getBatches } from "@/lib/batchesService";
import { TrainerModal } from "./TrainerModal";
import { CertifiedAccreditations } from "@/pages/trainers-members/trainers/CertifiedAccreditations";

export default function TrainerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [assignedBatches, setAssignedBatches] = useState([]);

  // Phase 6: Monthly Coaching & Class Conduction State
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [monthTracking, setMonthTracking] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const loadAssignedBatches = useCallback(() => {
    try {
      Promise.resolve(getBatches())
        .then((all) => {
          const list = Array.isArray(all) ? all : [];
          setAssignedBatches(
            list.filter((b) => (Array.isArray(b.trainerIds) && b.trainerIds.includes(id)) || (Array.isArray(trainer?.batchIds) && trainer.batchIds.includes(b.id)))
          );
        })
        .catch(() => setAssignedBatches([]));
    } catch {
      setAssignedBatches([]);
    }
  }, [id, trainer?.batchIds]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getTrainerById(id)
      .then((data) => {
        if (!cancelled) setTrainer(data);
      })
      .catch(() => {
        if (!cancelled) setTrainer(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    loadAssignedBatches();
  }, [loadAssignedBatches]);

  const loadMonthTracking = useCallback(() => {
    if (!id) return;
    setIsTrackingLoading(true);
    getTrainerMonthTracking(id, selectedMonth)
      .then((data) => setMonthTracking(data))
      .catch((err) => {
        console.error("Failed to load trainer month tracking:", err);
        setMonthTracking(null);
      })
      .finally(() => setIsTrackingLoading(false));
  }, [id, selectedMonth]);

  useEffect(() => {
    loadMonthTracking();
  }, [loadMonthTracking]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    setSelectedMonth(prevDate.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    setSelectedMonth(nextDate.toISOString().slice(0, 7));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  const formattedSelectedMonth = useMemo(() => {
    try {
      const [y, m] = selectedMonth.split("-").map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return selectedMonth;
    }
  }, [selectedMonth]);

  const coachingSummary = useMemo(() => {
    const s = monthTracking?.summary;
    const conducted = s?.totalClassesConducted || 0;
    const scheduled = s?.totalClassesScheduled || 0;
    const rate = scheduled > 0 ? Math.round((conducted / scheduled) * 100) : conducted > 0 ? 100 : 0;
    return {
      totalBatchesAssigned: s?.totalBatchesAssigned || assignedBatches.length || 0,
      totalClassesScheduled: scheduled,
      totalClassesConducted: conducted,
      conductionRate: rate,
      totalCoachingHours: s?.totalCoachingHours || 0,
      totalAttendeesCoached: s?.totalAttendeesCoached || 0,
      averageClassAttendance: s?.averageClassAttendance || 0,
    };
  }, [monthTracking, assignedBatches]);

  const activelyCoachedBatches = useMemo(() => {
    if (monthTracking?.assignedBatches && Array.isArray(monthTracking.assignedBatches) && monthTracking.assignedBatches.length > 0) {
      return monthTracking.assignedBatches;
    }
    return assignedBatches.map((b) => ({
      id: b.id,
      name: b.name,
      timingLabel: b.timingLabel || b.timing || "Standard Timing",
      daysLabel: b.daysLabel || b.daysPattern || "Scheduled Days",
      currentPax: b.memberIds ? b.memberIds.length : b.currentPax || 0,
      maxPax: b.maxPax || 25,
    }));
  }, [monthTracking, assignedBatches]);

  const substituteSessions = useMemo(() => {
    if (monthTracking?.substituteLogs && Array.isArray(monthTracking.substituteLogs)) {
      return monthTracking.substituteLogs;
    }
    const allLogs = monthTracking?.trainerLogs || [];
    return allLogs.filter(
      (l) => l.status === "SUBSTITUTE" || l.substituteTrainerId || l.trainerId !== id
    );
  }, [monthTracking, id]);

  const trainerPhoto = useMemo(() => {
    return getTrainerPhoto(trainer);
  }, [trainer]);

  const initials = useMemo(() => {
    if (!trainer?.name) return "T";
    return trainer.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [trainer?.name]);

  const isInactive = trainer?.status === "Inactive";

  const handleCopy = (text, fieldKey, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const updated = await updateTrainer(trainer.id, formData);
      if (updated) {
        setTrainer(updated);
        loadAssignedBatches();
        toast.success("Trainer profile updated successfully.");
      }
    } catch (e) {
      toast.error(e?.message || "Failed to update Trainer.");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(`Are you sure you want to remove ${trainer.name} from the training roster?`)
    )
      return;
    try {
      await deleteTrainer(trainer.id);
      toast.success(`${trainer.name} has been removed.`);
      navigate("/admin/trainers-members/trainers");
    } catch (e) {
      toast.error(e?.message || "Failed to delete trainer.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground no-scrollbar">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
        <p className="mt-3 text-sm">Loading Trainer profile…</p>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="py-16 text-center space-y-4 no-scrollbar">
        <AlertCircle size={48} className="mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-bold text-foreground">Trainer Not Found</h2>
        <p className="text-sm text-muted-foreground">
          No gym Trainer record exists with ID <strong className="text-foreground">{id}</strong>.
        </p>
        <button
          type="button"
          onClick={() => navigate("/admin/trainers-members/trainers")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-background hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Trainers Directory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 no-scrollbar">
      {/* Top Header & Breadcrumb Nav + Admin Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <ChevronRight size={13} />
          <Link
            to="/admin/trainers-members/trainers"
            className="hover:text-foreground transition-colors"
          >
            Trainers
          </Link>
          <ChevronRight size={13} />
          <span className="text-foreground font-semibold">{trainer.name}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/admin/trainers-members/trainers")}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Trainers</span>
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all shadow-sm cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <Link
            to={`/trainers/${trainer.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-sm cursor-pointer"
          >
            <ExternalLink size={14} />
            <span>View Public Profile</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-background shadow-sm hover:bg-primary/90 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Hero Trainer Profile Card (Clean design matching public portfolio) */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card/90 to-background p-6 sm:p-10 lg:p-12 shadow-sm backdrop-blur-xl">
        {/* Glowing Background Orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Trainer Portrait with Clean Image */}
          <div className="lg:col-span-4 flex justify-center lg:justify-start">
            <div className="relative group w-full max-w-sm rounded-3xl overflow-hidden border-2 border-border/80 bg-card shadow-lg">
              {trainerPhoto ? (
                <img
                  src={trainerPhoto}
                  alt={trainer.name}
                  width={800}
                  height={1000}
                  className="h-[420px] w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="h-[420px] w-full grid place-items-center bg-card text-muted-foreground">
                  <div className="text-center space-y-2">
                    <div className="h-20 w-20 rounded-full bg-muted/60 border border-border grid place-items-center mx-auto text-primary text-3xl font-display font-black">
                      {initials}
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      No Photo Uploaded
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Trainer Information */}
          <div className="lg:col-span-8 space-y-6">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight">
              {trainer.name}
            </h1>

            {/* Bio / Quote */}
            <div className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 text-sm sm:text-base italic text-foreground">
              "
              {trainer.quote ||
                trainer.bio ||
                "Dedicated to building relentless strength and sustainable athletic performance."}
              "
            </div>
          </div>
        </div>
      </div>

      {/* Trainer Official Profile & Form Details Grid */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
            Official Roster Specifications
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Trainer Profile
          </h2>
          <p className="text-sm text-muted-foreground">
            Verified identification, athletic background, and certified coaching credentials
            registered in The Strength Way directory.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Form Details Dossier Table (Left Column 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border pb-4">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span>Personal Details & Identification</span>
              </h3>

              <dl className="mt-6 divide-y divide-border text-sm">
                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Full Name</dt>
                  <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                    {trainer.name}
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Trainer ID</dt>
                  <dd className="mt-1 font-mono font-semibold text-emerald-500 sm:col-span-2 sm:mt-0">
                    {trainer.id}
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Specialization</dt>
                  <dd className="mt-1 font-semibold text-foreground sm:col-span-2 sm:mt-0">
                    {trainer.specialization || "Functional Movements & Kettlebell Specialist"}
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Experience</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
                    {trainer.experience} Professional Coaching
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Faculty Status</dt>
                  <dd className="mt-1 sm:col-span-2 sm:mt-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isInactive
                          ? "bg-muted text-muted-foreground"
                          : "bg-emerald-500/15 text-emerald-500"
                      }`}
                    >
                      {trainer.status || "Active"}
                    </span>
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Assigned Batches</dt>
                  <dd className="mt-1 sm:col-span-2 sm:mt-0">
                    {assignedBatches.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedBatches.map((b) => (
                          <Link
                            key={b.id}
                            to={`/admin/batches/${b.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-muted border border-border px-2 py-0.5 text-xs font-semibold text-foreground hover:bg-card hover:border-foreground/30 transition-colors"
                          >
                            <span>{b.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              ({b.daysPattern})
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">
                        No batches currently assigned
                      </span>
                    )}
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Mail size={14} className="text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${trainer.email}`}
                        className="hover:text-primary hover:underline truncate"
                      >
                        {trainer.email}
                      </a>
                    </div>
                    {trainer.email && (
                      <button
                        type="button"
                        onClick={() => handleCopy(trainer.email, "details-email", "Email address")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy email"
                      >
                        {copiedField === "details-email" ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-muted-foreground">Phone</dt>
                  <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-muted-foreground shrink-0" />
                      <span>{trainer.phone}</span>
                    </div>
                    {trainer.phone && (
                      <button
                        type="button"
                        onClick={() => handleCopy(trainer.phone, "details-phone", "Phone number")}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy phone"
                      >
                        {copiedField === "details-phone" ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    )}
                  </dd>
                </div>

                {trainer.joinedAt && (
                  <div className="py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-muted-foreground">Faculty Since</dt>
                    <dd className="mt-1 text-foreground sm:col-span-2 sm:mt-0">
                      {new Date(trainer.joinedAt).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Certified Accreditations Document Uploads & Bio (Right Column 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <CertifiedAccreditations
                trainer={trainer}
                onUpdateTrainer={handleSaveEdit}
                canUpload={true}
              />
            </div>

            {/* Philosophy & Biography Card */}
            {trainer.bio && (
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                  <Quote size={16} className="text-primary" />
                  <span>Coaching Philosophy & Background</span>
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                  {trainer.bio}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION: Monthly Coaching & Class Conduction (Phase 6)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-8">
        {/* Header with Title and Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Monthly Coaching & Class Conduction
                </h3>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent border border-accent/20">
                  Performance Ledger
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Class delivery execution, total coaching hours on gym floor, athlete turnouts, and substitute session logs.
              </p>
            </div>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="relative px-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  title="Select Month"
                />
                <span className="text-xs font-bold text-foreground font-mono cursor-pointer select-none">
                  {formattedSelectedMonth}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleCurrentMonth}
              className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Current
            </button>
          </div>
        </div>

        {/* 1. Coaching KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Classes Scheduled vs Conducted */}
          <div className="rounded-2xl border border-border/80 bg-background/50 p-4.5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider">Scheduled vs Conducted</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {coachingSummary.totalClassesConducted}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                / {coachingSummary.totalClassesScheduled} classes
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-muted-foreground">Execution Rate</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-400 border border-emerald-500/20">
                {coachingSummary.conductionRate}% Delivered
              </span>
            </div>
          </div>

          {/* Coaching Hours Delivered */}
          <div className="rounded-2xl border border-border/80 bg-background/50 p-4.5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider">Hours Delivered</span>
              <Clock size={16} className="text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-accent">
                {coachingSummary.totalCoachingHours}
              </span>
              <span className="text-xs font-bold text-muted-foreground">Hours on Floor</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Cumulative session duration logged in {formattedSelectedMonth}
            </p>
          </div>

          {/* Average Attendance Per Class */}
          <div className="rounded-2xl border border-border/80 bg-background/50 p-4.5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avg Attendance / Class</span>
              <Users size={16} className="text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {coachingSummary.averageClassAttendance}
              </span>
              <span className="text-xs font-bold text-muted-foreground">Athletes / Session</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              {coachingSummary.totalAttendeesCoached} total athletes coached this month
            </p>
          </div>

          {/* Actively Coached Batches Count */}
          <div className="rounded-2xl border border-border/80 bg-background/50 p-4.5 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-bold uppercase tracking-wider">Batches Coached</span>
              <Layers size={16} className="text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {coachingSummary.totalBatchesAssigned}
              </span>
              <span className="text-xs font-bold text-muted-foreground">Active Containers</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              Containers under faculty management
            </p>
          </div>
        </div>

        {/* 2. Batches Actively Coached This Month */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-accent" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Batches Actively Coached This Month ({formattedSelectedMonth})
              </h4>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {activelyCoachedBatches.length} Containers
            </span>
          </div>

          {activelyCoachedBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activelyCoachedBatches.map((b) => {
                const maxPax = b.maxPax || 25;
                const currentPax = b.currentPax || 0;
                const pct = Math.min(Math.round((currentPax / maxPax) * 100), 100);

                return (
                  <div
                    key={b.id}
                    className="group rounded-2xl border border-border/70 bg-background/60 p-4.5 space-y-3 transition-all hover:border-accent/40 hover:bg-background"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/admin/batches/${b.id}`}
                          className="font-bold text-sm text-foreground hover:text-accent transition-colors flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{b.name}</span>
                          <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                        </Link>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ID: {b.id}
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 shrink-0">
                        Active
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock size={13} className="text-accent shrink-0" />
                        <span className="truncate">{b.timingLabel || "Standard Schedule"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar size={13} className="text-accent shrink-0" />
                        <span className="truncate">{b.daysLabel || "Weekly Days"}</span>
                      </div>
                    </div>

                    {/* Capacity Indicator */}
                    <div className="pt-2 border-t border-border/40 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Enrolled Capacity</span>
                        <span className="font-semibold text-foreground">
                          {currentPax} / {maxPax} Athletes ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            pct >= 90
                              ? "bg-rose-500"
                              : pct >= 70
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No batch containers currently assigned to this coach.
            </div>
          )}
        </div>

        {/* 3. Substitute Coaching Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Repeat size={16} className="text-amber-500" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Substitute Coaching Log ({formattedSelectedMonth})
              </h4>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {substituteSessions.length} {substituteSessions.length === 1 ? "Session" : "Sessions"}
            </span>
          </div>

          {substituteSessions.length > 0 ? (
            <div className="overflow-x-auto overflow-y-auto max-h-[380px] no-scrollbar pr-1">
              <table className="w-full text-left border-separate [border-spacing:0_8px] sm:[border-spacing:0_10px]">
                <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-xs text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground select-none">
                  <tr>
                    <th className="py-2.5 px-4 sm:px-5">Session Date & Time</th>
                    <th className="py-2.5 px-4 sm:px-5">Batch Container</th>
                    <th className="py-2.5 px-4 sm:px-5">Coverage Nature</th>
                    <th className="py-2.5 px-4 sm:px-5">Assigned / Substitute Coach</th>
                    <th className="py-2.5 px-4 sm:px-5 text-center">Attendees</th>
                    <th className="py-2.5 px-4 sm:px-5 text-right">Status / Notes</th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm font-medium">
                  {substituteSessions.map((log, idx) => {
                    const isSteppedIn = log.substituteTrainerId === id || log.trainerId !== id;

                    return (
                      <tr key={log.id || idx} className="group transition-all duration-150 hover:translate-y-[-1px]">
                        {/* Date & Time */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                          <div className="font-mono font-medium text-foreground">
                            {log.date}
                          </div>
                          <span className="text-[10px] text-muted-foreground block">
                            {log.checkInTime || "Scheduled Session"}
                          </span>
                        </td>

                        {/* Batch Container */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                          <Link
                            to={`/admin/batches/${log.batchId}`}
                            className="font-bold text-foreground hover:text-accent transition-colors flex items-center gap-1"
                          >
                            <span>{log.batchName || log.batchId}</span>
                            <ExternalLink size={11} className="text-muted-foreground shrink-0" />
                          </Link>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {log.batchId}
                          </span>
                        </td>

                        {/* Coverage Nature */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                              isSteppedIn
                                ? "bg-accent/10 text-accent border-accent/30"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            }`}
                          >
                            {isSteppedIn ? (
                              <>
                                <Check size={11} />
                                <span>Stepped In as Substitute</span>
                              </>
                            ) : (
                              <>
                                <Repeat size={11} />
                                <span>Covered by Substitute</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Coach names */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors">
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">
                              {isSteppedIn
                                ? `Covering for: ${log.trainerName || log.trainerId}`
                                : `Substituted by: ${log.substituteTrainerName || log.substituteTrainerId || "Substitute Coach"}`}
                            </span>
                          </div>
                        </td>

                        {/* Attendees */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-center whitespace-nowrap">
                          <span className="font-bold text-foreground font-mono">
                            {log.attendeesCount || 0}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {log.durationMinutes || 60}m
                          </span>
                        </td>

                        {/* Status / Notes */}
                        <td className="bg-card py-3 px-4 sm:px-5 align-middle border-y border-border/50 first:rounded-l-2xl first:border-l border-border/50 first:shadow-[-2px_2px_4px_rgba(0,0,0,0.02)] last:rounded-r-2xl last:border-r border-border/50 last:shadow-[2px_2px_4px_rgba(0,0,0,0.02)] shadow-xs group-hover:bg-muted/40 transition-colors text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40 px-2.5 py-0.5 text-[10px] font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {log.status || "CONDUCTED"}
                          </span>
                          {log.notes && (
                            <p className="text-[10px] text-muted-foreground italic mt-0.5 truncate max-w-xs ml-auto" title={log.notes}>
                              {log.notes}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No substitute coaching sessions recorded for {formattedSelectedMonth}. All scheduled classes were conducted as planned.
            </div>
          )}
        </div>
      </div>

      {/* Edit Trainer Modal with all corresponding fields */}
      <TrainerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSaveEdit}
        trainerToEdit={trainer}
      />
    </div>
  );
}
