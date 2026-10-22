import { useState } from "react";

/**
 * DashboardBarChart
 *
 * Renders an interactive, responsive SVG bar chart.
 * Supports:
 * - 'vertical': e.g. 12 months revenue, coach payouts, or monthly attendance %
 * - 'horizontal': e.g. batch-wise attendance rates
 *
 * @param {Object} props
 * @param {Array<{ label: string, value: number, formattedValue?: string, color?: string, subtitle?: string }>} props.data
 * @param {'vertical' | 'horizontal'} [props.orientation='vertical']
 * @param {string} [props.valuePrefix='']
 * @param {string} [props.valueSuffix='']
 * @param {number} [props.height=240]
 * @param {string} [props.barColor='#c57463']
 * @param {string} [props.emptyMessage='No chart data recorded for this timeframe']
 */
export default function DashboardBarChart({
  data = [],
  orientation = "vertical",
  valuePrefix = "",
  valueSuffix = "",
  height = 240,
  barColor = "#c57463",
  emptyMessage = "No chart data recorded for this timeframe",
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-border/60 rounded-xl bg-card/40"
        style={{ height }}
      >
        <p className="text-xs text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0), 1);

  if (orientation === "horizontal") {
    return (
      <div className="w-full flex flex-col gap-3 py-1">
        {data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = Math.min(100, Math.max(0, Math.round((val / maxValue) * 100)));
          const isHovered = hoveredIdx === idx;
          const displayColor = item.color || barColor;

          return (
            <div
              key={item.label || idx}
              className="group relative flex flex-col gap-1 cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground/90 truncate max-w-[200px] flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: displayColor }}
                  />
                  {item.label}
                  {item.subtitle && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({item.subtitle})
                    </span>
                  )}
                </span>
                <span className="font-semibold text-foreground tracking-tight tabular-nums ml-2">
                  {item.formattedValue ?? `${valuePrefix}${val.toLocaleString()}${valueSuffix}`}
                </span>
              </div>

              {/* Bar track */}
              <div className="w-full h-3 rounded-full bg-muted/40 overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: displayColor,
                    opacity: isHovered ? 1 : 0.85,
                    filter: isHovered ? "brightness(1.15)" : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical Bar Chart
  const svgWidth = 600;
  const paddingBottom = 32;
  const paddingTop = 24;
  const paddingLeft = 16;
  const paddingRight = 16;
  const chartHeight = height - paddingTop - paddingBottom;
  const barSlotWidth = (svgWidth - paddingLeft - paddingRight) / data.length;
  const barWidth = Math.max(8, Math.min(28, barSlotWidth * 0.55));

  // Y-axis grid tick levels
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full relative flex flex-col select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="barGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Background Grid Lines */}
        {ticks.map((t, i) => {
          const y = paddingTop + chartHeight * (1 - t);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
                strokeDasharray="3 3"
              />
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const val = Number(item.value) || 0;
          const barH = (val / maxValue) * chartHeight;
          const x = paddingLeft + idx * barSlotWidth + (barSlotWidth - barWidth) / 2;
          const y = paddingTop + (chartHeight - barH);
          const isHovered = hoveredIdx === idx;
          const color = item.color || barColor;

          return (
            <g
              key={item.label || idx}
              className="cursor-pointer transition-transform duration-200"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Invisible wider hit target */}
              <rect
                x={paddingLeft + idx * barSlotWidth}
                y={paddingTop}
                width={barSlotWidth}
                height={chartHeight + paddingBottom}
                fill="transparent"
              />

              {/* The bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barH)}
                rx={barWidth / 3}
                fill={color}
                opacity={isHovered ? 1 : 0.82}
                className="transition-all duration-200"
                style={{
                  filter: isHovered ? "drop-shadow(0 2px 8px rgba(0,0,0,0.35)) brightness(1.15)" : "none",
                }}
              />

              {/* Bar value label on top if hovered or highlighted */}
              {isHovered && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-[11px] font-bold fill-foreground"
                >
                  {item.formattedValue ?? `${valuePrefix}${val.toLocaleString()}${valueSuffix}`}
                </text>
              )}

              {/* X Axis Label */}
              <text
                x={x + barWidth / 2}
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

      {/* Tooltip display box if hovered */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="absolute top-1 right-2 pointer-events-none bg-popover/95 backdrop-blur-md text-popover-foreground border border-border/80 px-2.5 py-1.5 rounded-lg shadow-lg text-xs z-10 animate-in fade-in zoom-in-95 duration-150">
          <span className="font-semibold">{data[hoveredIdx].label}: </span>
          <span className="font-bold text-foreground ml-1">
            {data[hoveredIdx].formattedValue ??
              `${valuePrefix}${(Number(data[hoveredIdx].value) || 0).toLocaleString()}${valueSuffix}`}
          </span>
          {data[hoveredIdx].subtitle && (
            <span className="block text-[10px] text-muted-foreground mt-0.5">
              {data[hoveredIdx].subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
