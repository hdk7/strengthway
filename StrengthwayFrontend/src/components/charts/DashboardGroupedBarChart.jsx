import { useState } from "react";

/**
 * DashboardGroupedBarChart
 *
 * Side-by-side bars for comparing two metrics per month/timeframe (e.g. Revenue vs Coach Payouts).
 *
 * @param {Object} props
 * @param {Array<{ label: string, series1: number, series2: number, series1Label?: string, series2Label?: string }>} props.data
 * @param {string} [props.series1Name='Revenue']
 * @param {string} [props.series2Name='Coach Payouts']
 * @param {string} [props.series1Color='#10b981'] // emerald-500
 * @param {string} [props.series2Color='#c57463'] // terracotta
 * @param {string} [props.valuePrefix='₹']
 * @param {number} [props.height=250]
 */
export default function DashboardGroupedBarChart({
  data = [],
  series1Name = "Revenue",
  series2Name = "Coach Payouts",
  series1Color = "#10b981",
  series2Color = "#c57463",
  valuePrefix = "₹",
  height = 250,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center p-6 border border-dashed border-border/60 rounded-xl bg-card/40"
        style={{ height }}
      >
        <p className="text-xs text-muted-foreground">No financial comparison data available</p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.flatMap((d) => [Number(d.series1) || 0, Number(d.series2) || 0]),
    1000
  );

  const svgWidth = 650;
  const paddingTop = 26;
  const paddingBottom = 34;
  const paddingLeft = 20;
  const paddingRight = 20;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupSlotWidth = (svgWidth - paddingLeft - paddingRight) / data.length;
  const singleBarWidth = Math.max(5, Math.min(13, groupSlotWidth * 0.34));
  const barGap = 3;

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full relative flex flex-col select-none">
      {/* Legend header */}
      <div className="flex items-center justify-end gap-5 mb-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: series1Color }} />
          <span className="text-foreground/80">{series1Name}</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: series2Color }} />
          <span className="text-foreground/80">{series2Name}</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        {/* Horizontal gridlines */}
        {ticks.map((t, i) => {
          const y = paddingTop + chartHeight * (1 - t);
          return (
            <line
              key={i}
              x1={paddingLeft}
              y1={y}
              x2={svgWidth - paddingRight}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Grouped Bars */}
        {data.map((item, idx) => {
          const val1 = Number(item.series1) || 0;
          const val2 = Number(item.series2) || 0;
          const h1 = (val1 / maxVal) * chartHeight;
          const h2 = (val2 / maxVal) * chartHeight;

          const groupCenterX = paddingLeft + idx * groupSlotWidth + groupSlotWidth / 2;
          const x1 = groupCenterX - singleBarWidth - barGap / 2;
          const x2 = groupCenterX + barGap / 2;
          const y1 = paddingTop + (chartHeight - h1);
          const y2 = paddingTop + (chartHeight - h2);

          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={item.label || idx}
              className="cursor-pointer transition-transform duration-150"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Hit area */}
              <rect
                x={paddingLeft + idx * groupSlotWidth}
                y={paddingTop}
                width={groupSlotWidth}
                height={chartHeight + paddingBottom}
                fill="transparent"
              />

              {/* Series 1 Bar */}
              <rect
                x={x1}
                y={y1}
                width={singleBarWidth}
                height={Math.max(2, h1)}
                rx={singleBarWidth / 3}
                fill={series1Color}
                opacity={isHovered ? 1 : 0.85}
                style={{
                  filter: isHovered ? "brightness(1.15)" : "none",
                }}
              />

              {/* Series 2 Bar */}
              <rect
                x={x2}
                y={y2}
                width={singleBarWidth}
                height={Math.max(2, h2)}
                rx={singleBarWidth / 3}
                fill={series2Color}
                opacity={isHovered ? 1 : 0.85}
                style={{
                  filter: isHovered ? "brightness(1.15)" : "none",
                }}
              />

              {/* Month label */}
              <text
                x={groupCenterX}
                y={paddingTop + chartHeight + 18}
                textAnchor="middle"
                fill="currentColor"
                className={`text-[10px] tracking-tight ${
                  isHovered ? "font-bold fill-foreground" : "font-medium fill-muted-foreground"
                }`}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip with comprehensive financial context */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none bg-popover/95 backdrop-blur-md text-popover-foreground border border-border/80 px-3.5 py-2.5 rounded-xl shadow-xl text-xs z-10 animate-in fade-in zoom-in-95 duration-150">
          <div className="font-bold text-foreground mb-1.5 border-b border-border/50 pb-1">
            {data[hoveredIdx].label} Overview
          </div>
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: series1Color }} />
              {series1Name}:
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {valuePrefix}{(Number(data[hoveredIdx].series1) || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: series2Color }} />
              {series2Name}:
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {valuePrefix}{(Number(data[hoveredIdx].series2) || 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground/80 flex items-center justify-between">
            <span>Operating Difference:</span>
            <span
              className={`font-bold tabular-nums ${
                (Number(data[hoveredIdx].series1) || 0) >= (Number(data[hoveredIdx].series2) || 0)
                  ? "text-emerald-500"
                  : "text-amber-500"
              }`}
            >
              {valuePrefix}
              {(
                (Number(data[hoveredIdx].series1) || 0) - (Number(data[hoveredIdx].series2) || 0)
              ).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
