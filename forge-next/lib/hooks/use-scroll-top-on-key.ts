"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

const PIN_OBSERVER_MS = 500;

/** Pins a scroll container to the top when its load key or chrome readiness changes. */
export function useScrollTopOnKey(
  resetKey: string | number,
  alignWhenReady = true,
) {
  const ref = useRef<HTMLDivElement>(null);
  const resetKeyRef = useRef(resetKey);
  resetKeyRef.current = resetKey;

  const scrollToTop = useCallback(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    node.scrollTop = 0;
  }, []);

  useLayoutEffect(() => {
    if (!alignWhenReady) {
      return;
    }

    scrollToTop();

    let rafId = 0;
    let frameCount = 0;
    const pinOnFrames = () => {
      scrollToTop();
      frameCount += 1;
      if (frameCount < 4) {
        rafId = requestAnimationFrame(pinOnFrames);
      }
    };
    rafId = requestAnimationFrame(pinOnFrames);

    const node = ref.current;
    const content = node?.firstElementChild;
    const observer =
      content && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            if (resetKeyRef.current === resetKey) {
              scrollToTop();
            }
          })
        : null;

    if (content && observer) {
      observer.observe(content);
    }

    const stopObserver = window.setTimeout(() => {
      observer?.disconnect();
    }, PIN_OBSERVER_MS);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(stopObserver);
      observer?.disconnect();
    };
  }, [resetKey, alignWhenReady, scrollToTop]);

  return ref;
}
