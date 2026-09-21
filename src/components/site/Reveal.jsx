import { useInView } from "@/hooks/theme";

// tw-animate-css only ships a fixed animation-delay scale — 0/75/100/150/200/
// 300/500/700/1000ms — with no arbitrary-value support, so every ms value a
// caller passes below is snapped to the nearest step on that scale. That
// keeps every card's entrance in the same relative order (never out of
// sequence), just occasionally a touch closer together than an uneven 80ms/
// 100ms stagger would be — an imperceptible trade for using only real
// Tailwind classes, no inline style.
const DELAY_CLASSES = {
  0: "delay-0",
  80: "delay-75",
  100: "delay-100",
  150: "delay-150",
  160: "delay-150",
  200: "delay-200",
  240: "delay-200",
  300: "delay-300",
  320: "delay-300",
  400: "delay-300",
  480: "delay-500",
  500: "delay-500",
  560: "delay-500",
  600: "delay-500",
  640: "delay-700",
  700: "delay-700",
  720: "delay-700",
  800: "delay-700",
  880: "delay-1000",
  900: "delay-1000",
  1000: "delay-1000",
  1100: "delay-1000",
};

// Blur-up scroll reveal: starts faded/blurred/shifted down, sharpens into
// place the first time it enters the viewport. `delay` (ms) lets sibling
// cards in a grid stagger in one after another.
export function Reveal({ children, className = "", delay = 0, as: Tag = "div", ...props }) {
  const [ref, inView] = useInView();
  const delayClass = DELAY_CLASSES[delay] ?? "delay-1000";

  return (
    <Tag
      ref={ref}
      className={`transition-all duration-700 ease-out ${delayClass} ${
        inView ? "translate-y-0 opacity-100 blur-none" : "translate-y-6 opacity-0 blur-sm"
      } ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
