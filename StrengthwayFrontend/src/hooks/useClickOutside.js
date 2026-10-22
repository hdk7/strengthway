import { useEffect, useRef } from "react";

/**
 * Custom hook to detect clicks outside of a referenced element or elements.
 * @param {React.RefObject|React.RefObject[]} refOrRefs - Single ref or array of refs
 * @param {Function} handler - Callback to execute on outside click
 * @param {boolean} [enabled=true] - Whether the listener is active
 */
export function useClickOutside(refOrRefs, handler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    const listener = (event) => {
      const refs = Array.isArray(refOrRefs) ? refOrRefs : [refOrRefs];
      const isInside = refs.some(
        (ref) => ref?.current && ref.current.contains(event.target)
      );

      if (!isInside) {
        handlerRef.current?.(event);
      }
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refOrRefs, enabled]);
}

export default useClickOutside;
