"use client";

import { useLayoutEffect, useRef } from "react";

/** Pins a scroll container to the top when its load key or chrome readiness changes. */
export function useScrollTopOnKey(
  resetKey: string | number,
  alignWhenReady = true,
) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!alignWhenReady) {
      return;
    }

    ref.current.scrollTop = 0;
  }, [resetKey, alignWhenReady]);

  return ref;
}
