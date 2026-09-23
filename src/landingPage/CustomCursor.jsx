import { useEffect, useRef, useState } from "react";

const HOVER_TARGETS = "a, button, [role='button'], input, textarea, select, .spotlight-card";

// Bold, premium cursor: a precise dot plus a trailing ring that eases toward
// it (lerp via requestAnimationFrame). mix-blend-mode: difference keeps it
// visible over both the black and white surfaces this site uses, without
// needing to know which theme/section is underneath. Only mounts on
// fine-pointer devices — touch/mobile is untouched.
export function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setEnabled(mq.matches);
    const onChange = (e) => setEnabled(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function place(el, x, y) {
      if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }

    function onMouseMove(e) {
      pos.current = { x: e.clientX, y: e.clientY };
      place(dotRef.current, e.clientX, e.clientY);
      if (reduceMotion) place(ringRef.current, e.clientX, e.clientY);
    }
    function onOver(e) {
      if (e.target.closest(HOVER_TARGETS)) setHovering(true);
    }
    function onOut(e) {
      if (e.target.closest(HOVER_TARGETS)) setHovering(false);
    }

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    let raf;
    if (!reduceMotion) {
      const loop = () => {
        ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.15;
        ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.15;
        place(ringRef.current, ringPos.current.x, ringPos.current.y);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-white mix-blend-difference"
      />
      <div
        ref={ringRef}
        className={`pointer-events-none fixed left-0 top-0 z-[9999] rounded-full border border-white mix-blend-difference transition-[width,height] duration-200 ease-out ${
          hovering ? "h-12 w-12" : "h-7 w-7"
        }`}
      />
    </>
  );
}
