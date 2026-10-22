import { cn } from "@/lib/utils";

const KPI_COLOR_VARIANTS = {
  emerald: {
    hoverBorder: "hover:border-emerald-500/50",
    iconBg: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
  },
  amber: {
    hoverBorder: "hover:border-amber-500/50",
    iconBg: "bg-amber-500/10 text-amber-500 dark:text-amber-400",
  },
  sky: {
    hoverBorder: "hover:border-sky-500/50",
    iconBg: "bg-sky-500/10 text-sky-500 dark:text-sky-400",
  },
  terracotta: {
    hoverBorder: "hover:border-terracotta/50",
    iconBg: "bg-terracotta/10 text-terracotta",
  },
  rose: {
    hoverBorder: "hover:border-rose-500/50",
    iconBg: "bg-rose-500/10 text-rose-500 dark:text-rose-400",
  },
  indigo: {
    hoverBorder: "hover:border-indigo-500/50",
    iconBg: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400",
  },
  neutral: {
    hoverBorder: "hover:border-border",
    iconBg: "bg-muted/70 text-muted-foreground",
  },
};

export function KpiCard({
  title,
  label,
  value,
  subtext,
  icon: Icon,
  variant,
  color,
  valueColor = "text-foreground",
  className = "",
  onClick,
}) {
  const displayTitle = title || label;
  const activeVariant = variant || color || "emerald";
  const colorConfig = KPI_COLOR_VARIANTS[activeVariant] || KPI_COLOR_VARIANTS.emerald;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col justify-between gap-2 relative overflow-hidden group transition-all",
        colorConfig.hoverBorder,
        onClick && "cursor-pointer hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground tracking-tight">
          {displayTitle}
        </span>
        {Icon && (
          <span
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
              colorConfig.iconBg,
            )}
          >
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>

      <div>
        <div className={cn("text-xl font-black tabular-nums tracking-tight", valueColor)}>
          {value}
        </div>
        {subtext && (
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
