import { createPortal } from "react-dom";
import { X, Users, Search, Plus, Check } from "lucide-react";

export default function AddMemberModal({
  isOpen,
  onClose,
  batch,
  currentPax,
  capacity,
  remainingSlots,
  allMembers = [],
  memberModalSearch,
  setMemberModalSearch,
  onEnrollMember,
}) {
  if (!isOpen || typeof document === "undefined" || !batch) {
    return null;
  }

  const filteredMembers = (Array.isArray(allMembers) ? allMembers : [])
    .filter((m) => !m.isDeleted)
    .filter((m) => {
      const q = (memberModalSearch || "").toLowerCase();
      return (
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.id?.toLowerCase().includes(q) ||
        m.mobile?.includes(q)
      );
    })
    .slice(0, 30);

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/25 dark:bg-black/55 backdrop-blur-[1.5px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border/60 p-5 bg-white dark:bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-foreground font-display">
                Add Member to {batch.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Batch Capacity: {currentPax} / {capacity} Pax ({remainingSlots} slots remaining)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search member by name, ID, or phone..."
              value={memberModalSearch}
              onChange={(e) => setMemberModalSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-border bg-slate-50/90 dark:bg-muted/40 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-foreground placeholder:text-slate-400 focus:border-blue-600 focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
            />
          </div>

          {/* Member list */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filteredMembers.map((mem) => {
              const isInThisBatch = mem.batchId === batch.id;
              return (
                <div
                  key={mem.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 dark:border-border/80 bg-slate-50/50 dark:bg-muted/20 p-3 hover:bg-slate-100/60 dark:hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
                      {mem.firstName?.charAt(0)}
                      {mem.lastName?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-foreground text-xs truncate">
                        {mem.firstName} {mem.lastName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-muted-foreground truncate">
                        {mem.id} • {mem.mobile}{" "}
                        {mem.batchId && mem.batchId !== batch.id
                          ? `• Current: ${mem.batchId}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isInThisBatch ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        <Check size={12} />
                        Enrolled
                      </span>
                    ) : (
                      <button
                        onClick={() => onEnrollMember(mem)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
                      >
                        <Plus size={13} />
                        Enroll
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
