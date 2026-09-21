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
    <Tag className={`spotlight-card ${className}`} onMouseMove={handleMouseMove} {...props}>
      {children}
    </Tag>
  );
}
