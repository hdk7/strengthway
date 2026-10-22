/**
 * DashboardProgressBar
 *
 * Smooth animated progress bar with customizable gradient / color states,
 * percentage badges, and status labels.
 *
 * @param {Object} props
 * @param {number} props.value
 * @param {number} [props.max=100]
 * @param {string} [props.label]
 * @param {string} [props.rightLabel]
 * @param {string} [props.variant='terracotta'] 'terracotta' | 'emerald' | 'amber' | 'sky' | 'dynamic'
 * @param {number} [props.height=8]
 */
export default function DashboardProgressBar({
  value = 0,
  max = 100,
  label,
  rightLabel,
  variant = "terracotta",
  height = 8,
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / (max || 1)) * 100)));

  const getGradient = () => {
    if (variant === "dynamic") {
      if (percentage >= 80) return "bg-emerald-500";
      if (percentage >= 40) return "bg-amber-500";
      return "bg-rose-500";
    }
    switch (variant) {
      case "emerald":
        return "bg-gradient-to-r from-emerald-500 to-teal-400";
      case "amber":
        return "bg-gradient-to-r from-amber-500 to-yellow-400";
      case "sky":
        return "bg-gradient-to-r from-sky-500 to-indigo-400";
      case "terracotta":
      default:
        return "bg-gradient-to-r from-[#c57463] to-[#e08e7d]";
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {(label || rightLabel) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-foreground/80">{label}</span>}
          {rightLabel && (
            <span className="font-semibold tabular-nums text-foreground">{rightLabel}</span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full bg-muted/40 overflow-hidden relative"
        style={{ height }}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getGradient()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
