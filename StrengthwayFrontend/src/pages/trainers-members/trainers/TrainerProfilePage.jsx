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
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import {
  getTrainerById,
  getTrainerPhoto,
  updateTrainer,
  deleteTrainer,
  getTrainerMonthTracking,
} from "@/lib/trainersService";
import { checkProfileAccount } from "@/lib/usersService";
import ProfileAccountModal from "@/pages/users/ProfileAccountModal";
import { getBatches } from "@/lib/batchesService";
import { TrainerModal } from "./TrainerModal";
import { TrainerProfileView } from "./TrainerProfileView";
import { TrainerMonthlyCoachingPanel } from "./TrainerMonthlyCoachingPanel";
import { isAdmin, isTrainer } from "@/auth/currentUser";
import {
  stepMonth,
  getCurrentYearMonth,
  formatYearMonth,
} from "@/components/ui/MonthPicker";

export default function TrainerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [accountInfo, setAccountInfo] = useState({ hasAccount: false, user: null });
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const loadAccountStatus = useCallback(() => {
    if (!id) return;
    checkProfileAccount("trainer", id)
      .then((res) => setAccountInfo(res || { hasAccount: false, user: null }))
      .catch(() => setAccountInfo({ hasAccount: false, user: null }));
  }, [id]);

  useEffect(() => {
    loadAccountStatus();
  }, [loadAccountStatus]);

  // Phase 6: Monthly Coaching & Class Conduction State
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentYearMonth());
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
    setSelectedMonth((prev) => stepMonth(prev, -1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => stepMonth(prev, 1));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(getCurrentYearMonth());
  };

  const formattedSelectedMonth = useMemo(() => {
    return formatYearMonth(selectedMonth);
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
          onClick={() => navigate(isTrainer() ? "/admin/dashboard" : "/admin/trainers-members/trainers")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-background hover:bg-primary/90 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>{isTrainer() ? "Back to Dashboard" : "Back to Trainers Directory"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 no-scrollbar">
      {/* Top Header & Admin Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-display">
              {trainer.name}
            </h1>
            {accountInfo?.hasAccount && isAdmin() && (
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                title="Click to manage login account"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold transition-all cursor-pointer ${
                  accountInfo.user?.isActive !== false
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                    : "bg-destructive/15 border border-destructive/30 text-destructive hover:bg-destructive/25"
                }`}
              >
                <ShieldCheck size={13} />
                <span>Login: {accountInfo.user?.isActive !== false ? "Active" : "Deactivated"}</span>
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Faculty Coach ID: {trainer.id} • {trainer.specialization || "Strength Specialist"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {isTrainer() ? (
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/admin/trainers-members/trainers")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold text-foreground hover:bg-muted hover:border-foreground/30 transition-all shadow-xs cursor-pointer active:scale-[0.99]"
            >
              <ArrowLeft size={16} />
              <span>Back to Trainers</span>
            </button>
          )}

          <Link
            to={`/trainers/${trainer.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
          >
            <ExternalLink size={16} />
            <span>View Public Profile</span>
          </Link>

          {isAdmin() && (
            <>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(true)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99] ${
                  accountInfo?.hasAccount
                    ? "border border-border bg-card hover:bg-muted text-foreground"
                    : "border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {accountInfo?.hasAccount ? <ShieldCheck size={16} /> : <KeyRound size={16} />}
                <span>{accountInfo?.hasAccount ? "Manage Login Account" : "Create Login Account"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white px-5 sm:px-6 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive px-4 sm:px-5 py-2.5 min-h-[40px] text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Unified Profile Layout & Sections */}
      <TrainerProfileView
        trainer={trainer}
        assignedBatches={assignedBatches}
        onUpdateTrainer={handleSaveEdit}
        isAdmin={true}
        canUploadAccreditations={true}
      >
        {/* SECTION: Monthly Coaching & Class Conduction (Phase 6) */}
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
        />
      </TrainerProfileView>

      {/* Edit Trainer Modal with all corresponding fields */}
      <TrainerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleSaveEdit}
        trainerToEdit={trainer}
      />

      {/* User Login Account Provision / Management Modal */}
      {isAccountModalOpen && (
        <ProfileAccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          onSuccess={() => {
            loadAccountStatus();
          }}
          type="trainer"
          profile={trainer}
          existingAccount={accountInfo.user}
        />
      )}
    </div>
  );
}
