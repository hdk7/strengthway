import { Check, X } from "lucide-react";
import ClockFace from "./ClockFace";

// --- Clock Picker Popover -----------------------------------------------------
// Renders the floating popover that contains the analog clock face,
// step indicator, and confirm/cancel buttons.

export default function ClockPickerPopover({
  clockStep,
  clockHour,
  clockMinute,
  clockPeriod,
  onStepChange,
  onHourClick,
  onMinuteClick,
  onPeriodToggle,
  onConfirm,
  onClose,
}) {
  const displayTime = `${String(clockHour).padStart(2, "0")}:${String(clockMinute).padStart(2, "0")} ${clockPeriod}`;

  return (
    <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-64 rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150 overflow-hidden">
      {/* Header: step indicator + current time preview */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => onStepChange("hour")}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              clockStep === "hour"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {String(clockHour).padStart(2, "0")}
          </button>
          <span className="text-muted-foreground font-bold">:</span>
          <button
            type="button"
            onClick={() => onStepChange("minute")}
            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
              clockStep === "minute"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {String(clockMinute).padStart(2, "0")}
          </button>
          <span className="text-[10px] text-muted-foreground ml-0.5">{clockPeriod}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
          aria-label="Close clock picker"
        >
          <X size={14} />
        </button>
      </div>

      {/* Step label */}
      <div className="px-4 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {clockStep === "hour" ? "Select hour" : "Select minute"}
        </span>
      </div>

      {/* Clock face */}
      <div className="flex justify-center px-3 pb-2">
        <ClockFace
          step={clockStep}
          clockHour={clockHour}
          clockMinute={clockMinute}
          clockPeriod={clockPeriod}
          onHourClick={onHourClick}
          onMinuteClick={onMinuteClick}
          onPeriodToggle={onPeriodToggle}
        />
      </div>

      {/* Confirm / Cancel */}
      <div className="flex gap-2 px-3 pb-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/60 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground py-2 text-xs font-bold hover:bg-accent/90 transition-colors cursor-pointer shadow-sm"
        >
          <Check size={13} />
          Set {displayTime}
        </button>
      </div>
    </div>
  );
}
