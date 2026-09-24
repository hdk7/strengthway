import { useId } from "react";
import { Clock } from "lucide-react";
import FormLabel from "../FormLabel";
import FormError from "../FormError";
import ClockPickerPopover from "./ClockPickerPopover";
import { useTimePicker } from "./useTimePicker";

// --- TimePickerField ----------------------------------------------------------

export default function TimePickerField({
  label,
  required = false,
  error,
  hint,
  id: providedId,
  name,
  value = "06:00 AM",
  onChange,
  disabled = false,
  size = "md",
  className = "",
  labelClassName = "",
  helperText,
}) {
  const generatedId = useId();
  const id = providedId || (name ? `time-${name}` : generatedId);
  const errorId = error ? `${id}-error` : undefined;

  const {
    hourRef,
    minuteRef,
    containerRef,
    hour,
    minute,
    period,
    handleHourChange,
    handleHourBlur,
    handleHourKeyDown,
    handleMinuteChange,
    handleMinuteBlur,
    handleMinuteKeyDown,
    handlePeriodToggle,
    isPickerOpen,
    setIsPickerOpen,
    clockStep,
    setClockStep,
    clockHour,
    setClockHour,
    clockMinute,
    setClockMinute,
    clockPeriod,
    setClockPeriod,
    openClock,
    handleClockHourClick,
    handleClockConfirm,
  } = useTimePicker({ value, name, onChange, disabled });

  const sizeStyles = size === "sm" ? "px-2.5 py-1.5 min-h-[36px]" : "px-3 py-2 min-h-[42px]";
  const stateStyles = error
    ? "border-destructive focus-within:border-destructive focus-within:ring-1 focus-within:ring-destructive"
    : "border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent";

  return (
    <div ref={containerRef} className={`relative flex flex-col text-left ${className}`}>
      {label && (
        <FormLabel
          htmlFor={`${id}-hour`}
          required={required}
          hint={hint}
          size={size}
          className={labelClassName}
        >
          {label}
        </FormLabel>
      )}

      {/* Segmented Time Control Box */}
      <div
        className={`flex items-center justify-between gap-1.5 rounded-xl border bg-background text-foreground transition-all ${sizeStyles} ${stateStyles} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {/* Hour : Minute inputs */}
        <div className="flex items-center gap-1">
          <input
            ref={hourRef}
            id={`${id}-hour`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={hour}
            onChange={handleHourChange}
            onBlur={handleHourBlur}
            onKeyDown={handleHourKeyDown}
            disabled={disabled}
            placeholder="06"
            className="w-7 text-center font-mono text-sm font-semibold tracking-wide text-foreground bg-transparent outline-none focus:bg-accent/20 rounded py-0.5 selection:bg-accent"
            aria-label={`${label || "Time"} Hour`}
          />
          <span className="text-muted-foreground font-bold select-none text-sm leading-none">
            :
          </span>
          <input
            ref={minuteRef}
            id={`${id}-minute`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            value={minute}
            onChange={handleMinuteChange}
            onBlur={handleMinuteBlur}
            onKeyDown={handleMinuteKeyDown}
            disabled={disabled}
            placeholder="00"
            className="w-7 text-center font-mono text-sm font-semibold tracking-wide text-foreground bg-transparent outline-none focus:bg-accent/20 rounded py-0.5 selection:bg-accent"
            aria-label={`${label || "Time"} Minute`}
          />
        </div>

        {/* AM/PM + Clock button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="inline-flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/50 select-none">
            {["AM", "PM"].map((p) => (
              <button
                key={p}
                type="button"
                disabled={disabled}
                onClick={() => handlePeriodToggle(p)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${
                  period === p
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={openClock}
            className={`rounded-lg p-1 transition-colors cursor-pointer ${
              isPickerOpen
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
            title="Pick time on clock"
            aria-label="Open clock time picker"
          >
            <Clock size={15} />
          </button>
        </div>
      </div>

      {/* Analog Clock Picker Popover */}
      {isPickerOpen && (
        <ClockPickerPopover
          clockStep={clockStep}
          clockHour={clockHour}
          clockMinute={clockMinute}
          clockPeriod={clockPeriod}
          onStepChange={setClockStep}
          onHourClick={handleClockHourClick}
          onMinuteClick={(m) => setClockMinute(m)}
          onPeriodToggle={(p) => setClockPeriod(p)}
          onConfirm={handleClockConfirm}
          onClose={() => setIsPickerOpen(false)}
        />
      )}

      <FormError error={error} id={errorId} />
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
