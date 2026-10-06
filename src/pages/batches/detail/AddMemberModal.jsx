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
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border p-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Add Member to {batch.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Batch Capacity: {currentPax} / {capacity} Pax ({remainingSlots} slots remaining)
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
                placeholder="Search member by name, ID, or phone..."
                value={memberModalSearch}
                onChange={(e) => setMemberModalSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
              />
            </div>

            {/* Member list */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredMembers.map((mem) => {
                const isInThisBatch = mem.batchId === batch.id;
                return (
                  <div
                    key={mem.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                        {mem.firstName?.charAt(0)}
                        {mem.lastName?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-foreground text-xs truncate">
                          {mem.firstName} {mem.lastName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {mem.id} • {mem.mobile}{" "}
                          {mem.batchId && mem.batchId !== batch.id
                            ? `• Current: ${mem.batchId}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isInThisBatch ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          <Check size={12} />
                          Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => onEnrollMember(mem)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer"
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
      </div>
    </div>,
    document.body,
  );
}
