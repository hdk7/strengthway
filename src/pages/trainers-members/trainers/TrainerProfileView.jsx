import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Quote } from "lucide-react";
import { getTrainerPhoto } from "@/lib/trainersService";
import { getBatches } from "@/lib/batchesService";
import { CertifiedAccreditations } from "./CertifiedAccreditations";

/**
 * Reusable Trainer Profile Component
 *
 * Provides a unified profile layout, fields, sections, and styling for both:
 * 1. Admin Trainer Module (`TrainerProfilePage`)
 * 2. Public Website (`PublicTrainerProfilePage`)
 *
 * @param {Object} props
 * @param {Object} props.trainer - Trainer entity
 * @param {Array} [props.assignedBatches] - Optional pre-loaded batches
 * @param {Function} [props.onUpdateTrainer] - Callback when trainer data (e.g., accreditations) changes
 * @param {boolean} [props.isAdmin=false] - Whether viewed in admin context (enables admin batch navigation)
 * @param {boolean} [props.canUploadAccreditations=true] - Whether certificate uploads are permitted
 * @param {React.ReactNode} [props.children] - Additional sections (e.g., Monthly Coaching Panel or Explore section)
 */
export function TrainerProfileView({
  trainer,
  assignedBatches: initialAssignedBatches,
  onUpdateTrainer,
  isAdmin = false,
  canUploadAccreditations = true,
  children,
}) {
  const [internalBatches, setInternalBatches] = useState([]);

  // Auto-fetch batches if not explicitly provided
  useEffect(() => {
    if (initialAssignedBatches !== undefined) return;
    if (!trainer?.id) return;

    let cancelled = false;
    getBatches()
      .then((all) => {
        if (cancelled) return;
        const list = Array.isArray(all) ? all : [];
        const filtered = list.filter(
          (b) =>
            (Array.isArray(b.trainerIds) && b.trainerIds.includes(trainer.id)) ||
            (Array.isArray(trainer?.batchIds) && trainer.batchIds.includes(b.id))
        );
        setInternalBatches(filtered);
      })
      .catch(() => {
        if (!cancelled) setInternalBatches([]);
      });

    return () => {
      cancelled = true;
    };
  }, [trainer?.id, trainer?.batchIds, initialAssignedBatches]);

  const assignedBatches = initialAssignedBatches !== undefined ? initialAssignedBatches : internalBatches;

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

  if (!trainer) return null;

  return (
    <div className="space-y-8">
      {/* Top 2-Card Row Matching Unified Profile Design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Name and Big Circular Portrait */}
        <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 flex flex-col items-center justify-center text-center shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight">
            {trainer.name}
          </h2>

          {/* Large Circular Avatar with Concentric Double Ring */}
          <div className="relative mx-auto mt-6 w-56 h-56 sm:w-64 sm:h-64 rounded-full p-2.5 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-border/80 shadow-2xl flex items-center justify-center">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-border/60 bg-muted/30 shadow-inner">
              {trainerPhoto ? (
                <img
                  src={trainerPhoto}
                  alt={trainer.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full grid place-items-center bg-card text-primary text-4xl font-display font-black">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Bio & other details */}
        <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-base sm:text-lg font-bold text-foreground font-display">
                Bio &amp; other details
              </h3>
            </div>

            {/* 2-column key-value grid */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm divide-y sm:divide-y-0 divide-border/40">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium block">
                  My Experience Level
                </span>
                <span className="text-sm font-semibold text-foreground block">
                  {trainer.experience ? `${trainer.experience} Professional Coaching` : "5 Years Professional Coaching"}
                </span>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0">
                <span className="text-xs text-muted-foreground font-medium block">
                  Trainer ID
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400 block">
                  {trainer.id}
                </span>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0">
                <span className="text-xs text-muted-foreground font-medium block">
                  Faculty Since
                </span>
                <span className="text-sm font-semibold text-foreground block">
                  {trainer.joinedAt
                    ? new Date(trainer.joinedAt).toLocaleDateString("en-IN", {
                        month: "long",
                        year: "numeric",
                      })
                    : "April 2026"}
                </span>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0">
                <span className="text-xs text-muted-foreground font-medium block">
                  Shift Schedule
                </span>
                <span className="text-sm font-semibold text-foreground block">
                  {trainer.shift || "Morning (06:00 - 14:00)"}
                </span>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0">
                <span className="text-xs text-muted-foreground font-medium block">
                  Availability
                </span>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    {isInactive ? "Inactive / On Leave" : "Available for Coaching"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0">
                <span className="text-xs text-muted-foreground font-medium block">
                  Official Email
                </span>
                <a
                  href={`mailto:${trainer.email}`}
                  className="text-sm font-medium text-foreground hover:text-accent truncate block"
                >
                  {trainer.email}
                </a>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0">
                <span className="text-xs text-muted-foreground font-medium block">
                  Contact Phone
                </span>
                <a
                  href={`tel:${trainer.phone}`}
                  className="text-sm font-medium text-foreground hover:text-accent block"
                >
                  {trainer.phone}
                </a>
              </div>

              <div className="space-y-1 pt-3 sm:pt-0 sm:col-span-2">
                <span className="text-xs text-muted-foreground font-medium block">
                  Assigned Batches
                </span>
                {assignedBatches && assignedBatches.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {assignedBatches.map((b) =>
                      isAdmin ? (
                        <Link
                          key={b.id}
                          to={`/admin/batches/${b.id}`}
                          className="inline-flex items-center rounded-lg bg-muted border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-card hover:border-accent transition-colors"
                        >
                          <span>{b.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({b.daysPattern || b.daysLabel || "Active"})
                          </span>
                        </Link>
                      ) : (
                        <span
                          key={b.id}
                          className="inline-flex items-center rounded-lg bg-muted border border-border px-2.5 py-1 text-xs font-semibold text-foreground"
                        >
                          <span>{b.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            ({b.daysPattern || b.daysLabel || "Active"})
                          </span>
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    No batches currently assigned
                  </span>
                )}
              </div>

              <div className="space-y-1 pt-3 sm:pt-0 sm:col-span-2">
                <span className="text-xs text-muted-foreground font-medium block">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-foreground/80">
                  <span className="text-accent font-medium">
                    #CrossFitL2, #StrengthAndConditioning, #Endurance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coaching Philosophy & Background Card */}
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Quote size={18} className="text-primary" />
          <h3 className="text-base sm:text-lg font-bold text-foreground font-display">
            Coaching Philosophy &amp; Background
          </h3>
        </div>
        {trainer.quote && (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs sm:text-sm italic text-foreground">
            "{trainer.quote}"
          </div>
        )}
        <p className="text-sm text-foreground/90 leading-relaxed font-sans">
          {trainer.bio ||
            "Dedicated to building relentless strength and sustainable athletic performance across all athlete levels."}
        </p>
      </div>

      {/* Certified Accreditations & Documents */}
      <div className="rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-xs">
        <CertifiedAccreditations
          trainer={trainer}
          onUpdateTrainer={onUpdateTrainer}
          canUpload={canUploadAccreditations}
        />
      </div>

      {/* Render optional child sections (e.g. Monthly Coaching Panel or Explore section) */}
      {children}
    </div>
  );
}

export default TrainerProfileView;
