function handleMouseMove(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
  el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
}

// Cursor-tracking glow on hover — a soft radial highlight that follows the
// mouse across the card's border/surface. Pass through refs/props so this
// can drop in wherever a plain <div> (or <button>, via `as`) card wrapper was.
export function SpotlightCard({ children, className = "", as: Tag = "div", ...props }) {
  return (
    <Tag
      data-spotlight="true"
      className={`relative isolate before:content-[''] before:absolute before:inset-0 before:z-1 before:rounded-[inherit] before:bg-[radial-gradient(220px_circle_at_var(--spot-x,50%)_var(--spot-y,50%),color-mix(in_oklab,var(--color-foreground)_12%,transparent),transparent_70%)] before:opacity-0 before:transition-opacity before:duration-300 before:pointer-events-none hover:before:opacity-100 ${className}`}
      onMouseMove={handleMouseMove}
      {...props}
    >
      {children}
    </Tag>
  );
}
