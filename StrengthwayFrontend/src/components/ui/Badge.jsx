import { cn } from "@/lib/utils";
import { formatEntityId } from "@/lib/formatters";

const BADGE_VARIANTS = {
  success:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  warning:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  danger:
    "bg-destructive/15 text-destructive border-destructive/30",
  info:
    "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  neutral:
    "bg-muted/70 text-muted-foreground border-border/50",
  accent:
    "bg-accent/15 text-accent border-accent/30",
  terracotta:
    "bg-terracotta/15 text-terracotta border-terracotta/30",
};

const BADGE_SIZES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-xs",
};

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  dot = false,
  ...props
}) {
  const variantStyles = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral;
  const sizeStyles = BADGE_SIZES[size] || BADGE_SIZES.md;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold border select-none transition-all",
        variantStyles,
        sizeStyles,
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-80" />
      )}
      {children}
    </span>
  );
}

/**
 * Status mapping table for automatic coloring based on domain entity status.
 */
const STATUS_VARIANT_MAP = {
  active: "success",
  paid: "success",
  completed: "success",
  approved: "success",
  present: "success",
  enrolled: "success",
  cleared: "success",

  pending: "warning",
  "partially paid": "warning",
  partial: "warning",
  "needs follow-up": "warning",
  "on leave": "warning",

  inactive: "neutral",
  draft: "neutral",
  archived: "neutral",
  lead: "neutral",
  new: "neutral",
  inquiry: "neutral",

  overdue: "danger",
  failed: "danger",
  cancelled: "danger",
  rejected: "danger",
  absent: "danger",
  denied: "danger",
};

export function StatusBadge({
  status,
  size = "md",
  className = "",
  dot = true,
  ...props
}) {
  if (!status) return null;
  const normalized = String(status).toLowerCase().trim();
  const variant = STATUS_VARIANT_MAP[normalized] || "neutral";

  return (
    <Badge
      variant={variant}
      size={size}
      dot={dot}
      className={cn("capitalize", className)}
      {...props}
    >
      {status}
    </Badge>
  );
}

/**
 * Standardized entity ID badge (e.g. #INQ-001 or #4B2F1E)
 */
export function IdBadge({ id, maxLen = 7, className = "" }) {
  if (!id) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] font-semibold bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full border border-border/40 shadow-2xs select-none",
        className,
      )}
    >
      #{formatEntityId(id, maxLen)}
    </span>
  );
}

export default Badge;
