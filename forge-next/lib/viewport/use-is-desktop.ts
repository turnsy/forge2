"use client";

import { useEffect, useState } from "react";
import { DESKTOP_MIN_WIDTH_PX } from "@/lib/viewport/breakpoints";
import { desktopMediaQuery } from "@/lib/viewport/match-media-query";

export function useIsDesktop(minWidth = DESKTOP_MIN_WIDTH_PX): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = desktopMediaQuery(minWidth);
    const mediaQuery = window.matchMedia(query);

    function update() {
      setIsDesktop(mediaQuery.matches);
    }

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, [minWidth]);

  return isDesktop;
}
