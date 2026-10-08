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
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
        <span>
          Faculty trainers assigned to <strong>{batch?.name}</strong> for{" "}
          <strong>{formattedMonthLabel}</strong>
        </span>
        <span>{filteredTrainers.length} active coaches</span>
      </div>

      {filteredTrainers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/50">
          <UserCheck size={32} className="mx-auto text-muted-foreground/60 mb-2" />
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
              onClick={onOpenAddTrainer}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-background hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Trainer to Batch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredTrainers.map((trn) => (
            <div
              key={trn.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-foreground/20 transition-all gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/60">
                  {getTrainerPhoto(trn) ? (
                    <img
                      src={getTrainerPhoto(trn)}
                      alt={trn.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-foreground">
                      {trn.name?.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-foreground text-base truncate">{trn.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        {trn.status || "Active"}
                      </span>
                      <button
                        onClick={() => onUnassignTrainer(trn.id, trn.name)}
                        className="rounded-lg p-1 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove coach from this batch"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Conduction Stats Pill: Assigned, Conducted, Shift Slot */}
              <div className="rounded-xl bg-muted/40 border border-border/60 p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                    Assigned
                  </span>
                  <span className="font-bold text-foreground text-sm">
                    {currentBatchSessions.length || 12} Classes
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                    Conducted
                  </span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {trn.classesConducted || 0} Classes
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold">
                    Shift Slot
                  </span>
                  <span
                    className="font-bold text-blue-400 text-xs truncate block"
                    title={batch?.timingLabel}
                  >
                    {batch?.daysPattern || "MWF"} ({batch?.timingLabel?.slice(0, 8) || "Morning"})
                  </span>
                </div>
              </div>

              {/* Quick trigger footer */}
              <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                <span className="text-[11px] text-muted-foreground">
                  Coaching Slot: <strong className="text-foreground">{batch?.daysLabel}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
