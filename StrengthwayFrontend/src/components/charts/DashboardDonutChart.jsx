import { useState } from "react";

/**
 * DashboardDonutChart
 *
 * Premium SVG Donut chart with smooth stroke dash calculations, interactive hover highlights,
 * central metric summary, and clean legend badges.
 *
 * @param {Object} props
 * @param {Array<{ label: string, value: number, color: string, subtitle?: string }>} props.segments
 * @param {string} [props.centerLabel='Total']
 * @param {string} [props.centerValue]
 * @param {number} [props.size=190]
 * @param {number} [props.strokeWidth=24]
 */
export default function DashboardDonutChart({
  segments = [],
  centerLabel = "Total",
  centerValue,
  size = 190,
  strokeWidth = 24,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);

  if (!segments || segments.length === 0 || total === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 border border-dashed border-border/60 rounded-xl bg-card/40 text-center"
        style={{ minHeight: size }}
      >
        <p className="text-xs text-muted-foreground">No attendance records logged</p>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  // Active hover segment data
  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg] overflow-visible">
          {/* Base background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth={strokeWidth}
          />

          {/* Arcs */}
          {segments.map((seg, idx) => {
            const val = Number(seg.value) || 0;
            const segmentRatio = val / total;
            const strokeDasharray = `${segmentRatio * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedOffset;
            accumulatedOffset += segmentRatio * circumference;

            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={seg.label || idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 ease-out"
                style={{
                  filter: isHovered ? "drop-shadow(0 0 8px rgba(0,0,0,0.4)) brightness(1.2)" : "none",
                  opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-3">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {activeSegment ? activeSegment.label : centerLabel}
          </span>
          <span className="text-xl font-black text-foreground tabular-nums tracking-tight">
            {activeSegment
              ? `${activeSegment.value.toLocaleString()}`
              : (centerValue ?? total.toLocaleString())}
          </span>
          <span className="text-[10px] text-muted-foreground/80 font-semibold">
            {activeSegment
              ? `${Math.round((activeSegment.value / total) * 100)}%`
              : "Sessions"}
          </span>
        </div>
      </div>

      {/* Legend Badges */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {segments.map((seg, idx) => {
          const val = Number(seg.value) || 0;
          const pct = Math.round((val / total) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={seg.label || idx}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-all duration-150 ${
                isHovered
                  ? "bg-muted/80 border-border text-foreground font-semibold shadow-sm"
                  : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="truncate max-w-[120px]">{seg.label}</span>
              <span className="font-bold tabular-nums text-foreground ml-auto">
                {val} <span className="text-[10px] text-muted-foreground font-normal">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
