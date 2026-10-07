/* eslint-disable max-lines */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  ExternalLink,
  AlertCircle,
  Quote,
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
import { TrainerDetailsDossier } from "./TrainerDetailsDossier";
import { TrainerMonthlyCoachingPanel } from "./TrainerMonthlyCoachingPanel";

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
      {/* Top Header & Admin Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <button
          type="button"
          onClick={() => navigate("/admin/trainers-members/trainers")}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
        >
          <ArrowLeft size={16} />
          <span>Back to Trainers</span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>

          <Link
            to={`/trainers/${trainer.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <ExternalLink size={16} />
            <span>View Public Profile</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
          >
            <Edit3 size={16} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Hero Trainer Profile Card (Clean design matching public portfolio) */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-linear-to-b from-card via-card/90 to-background p-6 sm:p-10 lg:p-12 shadow-sm backdrop-blur-xl">
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
                  className="h-105 w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="h-105 w-full grid place-items-center bg-card text-muted-foreground">
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
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
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
            <TrainerDetailsDossier
              trainer={trainer}
              assignedBatches={assignedBatches}
              handleCopy={handleCopy}
              copiedField={copiedField}
              isInactive={isInactive}
            />
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
      <TrainerMonthlyCoachingPanel
        id={id}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        formattedSelectedMonth={formattedSelectedMonth}
        handlePrevMonth={handlePrevMonth}
        handleNextMonth={handleNextMonth}
        handleCurrentMonth={handleCurrentMonth}
        coachingSummary={coachingSummary}
        activelyCoachedBatches={activelyCoachedBatches}
        substituteSessions={substituteSessions}
      />

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
