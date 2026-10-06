import { createPortal } from "react-dom";
import { X, UserCheck, Search, Plus, Check } from "lucide-react";
import { getTrainerPhoto } from "@/lib/trainersService";

export default function AddTrainerModal({
  isOpen,
  onClose,
  batch,
  allTrainers = [],
  trainerSearchQuery,
  setTrainerSearchQuery,
  onAssignTrainer,
}) {
  if (!isOpen || typeof document === "undefined" || !batch) {
    return null;
  }

  const filteredTrainers = allTrainers.filter((t) => {
    const q = (trainerSearchQuery || "").toLowerCase();
    return t.name?.toLowerCase().includes(q);
  });

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Add Trainer to {batch.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Assign coaches to {batch.timingLabel} ({batch.daysPattern})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search coaches by name..."
                value={trainerSearchQuery}
                onChange={(e) => setTrainerSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
            </div>

            {/* Coaches list */}
            <div className="space-y-2">
              {filteredTrainers.map((t) => {
                const isAssigned = (batch.trainerIds || []).includes(t.id);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                        {getTrainerPhoto(t) ? (
                          <img
                            src={getTrainerPhoto(t)}
                            alt={t.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          t.name?.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-xs truncate">
                          {t.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Faculty Coach • {t.experience || "3+ Yrs"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAssigned ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          <Check size={12} />
                          Assigned
                        </span>
                      ) : (
                        <button
                          onClick={() => onAssignTrainer(t.id, t.name)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          <Plus size={13} />
                          Assign
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
