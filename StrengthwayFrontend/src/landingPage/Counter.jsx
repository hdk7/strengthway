import { useEffect, useState } from "react";

export function Counter({ end, suffix = "", duration = 1500 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.floor(p * end));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return (
    <span>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}
