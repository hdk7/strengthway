// ─── Analog Clock Face ───────────────────────────────────────────────────────

const SIZE = 220; // SVG viewport size
const CX = SIZE / 2; // centre x
const CY = SIZE / 2; // centre y
const HOUR_R = 80; // radius where hour numbers sit
const MIN_R = 80; // radius where minute numbers sit
const HAND_R = 68; // radius of hand tip circle

function polarToXY(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + r * Math.cos(rad),
    y: CY + r * Math.sin(rad),
  };
}

export default function ClockFace({
  step,
  clockHour,
  clockMinute,
  clockPeriod,
  onHourClick,
  onMinuteClick,
  onPeriodToggle,
}) {
  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const isHourStep = step === "hour";

  const handAngle = isHourStep ? ((clockHour % 12) / 12) * 360 : (clockMinute / 60) * 360;

  const handTip = polarToXY(handAngle, HAND_R);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* AM / PM toggle */}
      <div className="inline-flex items-center rounded-xl bg-muted/50 border border-border/60 p-0.5 select-none">
        {["AM", "PM"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPeriodToggle(p)}
            className={`rounded-lg px-4 py-1 text-xs font-bold transition-all cursor-pointer ${
              clockPeriod === p
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Clock SVG */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="block select-none"
      >
        {/* Outer ring */}
        <circle cx={CX} cy={CY} r={CX - 4} className="fill-zinc-700 stroke-zinc-600 stroke-1" />
        {/* Inner dial */}
        <circle cx={CX} cy={CY} r={54} className="fill-zinc-800" />

        {/* Clock hand line */}
        <line
          x1={CX}
          y1={CY}
          x2={handTip.x}
          y2={handTip.y}
          className="stroke-primary stroke-2"
          strokeLinecap="round"
        />
        {/* Hand tip dot */}
        <circle cx={handTip.x} cy={handTip.y} r="11" className="fill-primary" />
        {/* Centre dot */}
        <circle cx={CX} cy={CY} r="4" className="fill-primary" />

        {/* Hour numbers */}
        {isHourStep &&
          hours.map((h, i) => {
            const angle = (i / 12) * 360;
            const { x, y } = polarToXY(angle, HOUR_R);
            const isActive = h === clockHour;
            return (
              <g key={h} onClick={() => onHourClick(h)} className="cursor-pointer">
                <circle cx={x} cy={y} r="17" className={isActive ? "fill-primary" : "fill-transparent"} />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="13"
                  fontWeight={isActive ? "700" : "500"}
                  className={isActive ? "fill-primary-foreground" : "fill-foreground"}
                >
                  {h}
                </text>
              </g>
            );
          })}

        {/* Minute numbers */}
        {!isHourStep &&
          minutes.map((m, i) => {
            const angle = (i / 12) * 360;
            const { x, y } = polarToXY(angle, MIN_R);
            const isActive = m === clockMinute;
            return (
              <g key={m} onClick={() => onMinuteClick(m)} className="cursor-pointer">
                <circle cx={x} cy={y} r="17" className={isActive ? "fill-primary" : "fill-transparent"} />
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12"
                  fontWeight={isActive ? "700" : "500"}
                  className={isActive ? "fill-primary-foreground" : "fill-foreground"}
                >
                  {String(m).padStart(2, "0")}
                </text>
              </g>
            );
          })}
      </svg>
    </div>
  );
}
