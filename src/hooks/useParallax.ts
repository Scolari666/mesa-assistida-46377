import { useEffect, useRef, useState } from "react";

/**
 * Lightweight scroll-driven parallax offset (in px), capped and eased so it
 * stays subtle on mobile. Returns 0 when the user prefers reduced motion.
 */
export function useParallax(strength = 0.25) {
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          setOffset(rect.top * strength);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [strength]);

  return { ref, offset };
}
