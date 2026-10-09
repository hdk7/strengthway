import {
  UserCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { getTrainerPhoto } from "@/lib/trainersService";

export default function BatchTrainersTab({
  batch,
  formattedMonthLabel,
  filteredTrainers = [],
  trainerSearch,
  currentBatchSessions = [],
  onOpenAddTrainer,
  onUnassignTrainer,
}) {
  return (
    <div className="space-y-3 animate-in fade-in duration-150 overflow-hidden">
      {/* Subtab Header Strip */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Faculty trainers assigned to <strong>{batch?.name}</strong> for{" "}
          <strong>{formattedMonthLabel}</strong>
        </span>
        <span className="font-semibold text-foreground">
          {filteredTrainers.length} {filteredTrainers.length === 1 ? "active coach" : "active coaches"}
        </span>
      </div>

      {filteredTrainers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center bg-card/40">
          <UserCheck size={28} className="mx-auto text-muted-foreground/60 mb-2" />
          <p className="font-semibold text-foreground text-sm">
            {trainerSearch ? "No matching trainers found" : "No trainers assigned"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {trainerSearch
              ? "Try searching with a different coach name or phone number."
              : `No coaches are currently assigned to ${batch?.name}. Assign an existing trainer to this batch.`}
          </p>
          {!trainerSearch && (
            <button
              type="button"
              onClick={onOpenAddTrainer}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Add Trainer to Batch</span>
            </button>
          )}
        </div>
      ) : (
        /* Compact Single-Page Grid (No Vertical Scroll) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredTrainers.map((trn) => (
            <div
              key={trn.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card/70 p-3.5 shadow-xs hover:border-foreground/20 transition-all gap-2.5"
            >
              {/* Header: Photo, Name, Status, Delete */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/70 shadow-2xs">
                  {getTrainerPhoto(trn) ? (
                    <img
                      src={getTrainerPhoto(trn)}
                      alt={trn.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-foreground">
                      {trn.name?.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-foreground text-sm truncate" title={trn.name}>
                      {trn.name}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        {trn.status || "Active"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUnassignTrainer(trn.id, trn.name)}
                        className="rounded-lg p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove coach from this batch"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate block">
                    Slot: {batch?.daysPattern || "MWF"} ({batch?.timingLabel?.slice(0, 10) || "Morning"})
                  </span>
                </div>
              </div>

              {/* Monthly Stats Strip */}
              <div className="rounded-xl bg-muted/40 border border-border/50 p-2 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                    Assigned
                  </span>
                  <span className="font-bold text-foreground text-xs">
                    {currentBatchSessions.length || 12} Classes
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                    Conducted
                  </span>
                  <span className="font-bold text-emerald-400 text-xs">
                    {trn.classesConducted || 0} Classes
                  </span>
                </div>
              </div>

              {/* Footer Slot Label */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                <span>Coaching Days</span>
                <span className="font-semibold text-foreground truncate max-w-[150px]">
                  {batch?.daysLabel || batch?.daysPattern}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
