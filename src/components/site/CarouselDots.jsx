import { useEffect, useState } from "react";

// Keep in sync with the `[animation-duration:4000ms]` class below — it has to
// be a static Tailwind class (not a style prop), so it can't read this value.
const AUTOPLAY_MS = 4000;

// Instagram-Stories-style progress dots: the active bar fills over the
// autoplay interval, then advances to the next slide. Hovering or dragging
// pauses the fill in place instead of resetting it.
export function CarouselDots({ api, count }) {
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!api) return;
    function onSelect() {
      setSelected(api.selectedScrollSnap());
    }
    function pause() {
      setPlaying(false);
    }
    function resume() {
      setPlaying(true);
    }
    onSelect();
    api.on("select", onSelect);
    api.on("pointerDown", pause);
    api.on("pointerUp", resume);
    return () => {
      api.off("select", onSelect);
      api.off("pointerDown", pause);
      api.off("pointerUp", resume);
    };
  }, [api]);

  useEffect(() => {
    if (!api || !playing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [api, playing]);

  if (!api || count < 2) return null;

  return (
    <div
      className="mt-6 flex items-center justify-center gap-2"
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => api.scrollTo(i)}
          className="h-1 w-10 overflow-hidden rounded-full bg-foreground/15"
        >
          {i === selected && (
            <span
              key={selected}
              className={`carousel-dot-fill [animation-duration:4000ms] block h-full w-full bg-foreground ${
                playing ? "" : "[animation-play-state:paused]"
              }`}
            />
          )}
        </button>
      ))}
    </div>
  );
}
