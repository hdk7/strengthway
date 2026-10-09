import { Clock, Check } from "lucide-react";

export default function TrainerBatchPicker({
  batchesList = [],
  selectedBatchIds = [],
  onToggleBatch,
  onSelectAll,
  onClearAll,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-accent" />
          <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">
            Batch Slots & Shift Timings
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">
            {selectedBatchIds?.length || 0} selected
          </span>
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[11px] text-accent hover:underline cursor-pointer font-medium"
          >
            Select All
          </button>
          <span className="text-border text-xs">•</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer font-medium"
          >
            Clear All
          </button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Select the batch slot(s) this trainer is assigned to. Changes will automatically reflect in batch schedules and trainer rosters.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {batchesList.map((batch) => {
          const isSelected = Array.isArray(selectedBatchIds) && selectedBatchIds.includes(batch.id);
          return (
            <div
              key={batch.id}
              onClick={() => onToggleBatch(batch.id)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onToggleBatch(batch.id);
                }
              }}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all select-none ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                  : "border-border/70 bg-card hover:bg-muted/50 hover:border-border"
              }`}
            >
              <div
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-md border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-background"
                    : "border-muted-foreground/40 bg-background"
                }`}
              >
                {isSelected && <Check size={11} strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-foreground tracking-tight">
                    {batch.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {batch.daysPattern || "MWF"}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {batch.timingLabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
