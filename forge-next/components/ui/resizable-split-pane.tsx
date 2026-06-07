"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const DEFAULT_RIGHT_FRACTION = 1 / 3;
const MIN_RIGHT_PX = 280;
const MIN_LEFT_PX = 320;

export function ResizableSplitPane({
  left,
  right,
  defaultRightFraction = DEFAULT_RIGHT_FRACTION,
}: {
  left: ReactNode;
  right: ReactNode;
  defaultRightFraction?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rightFraction, setRightFraction] = useState(defaultRightFraction);
  const draggingRef = useRef(false);

  const onPointerMove = useCallback((event: PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const offsetFromRight = rect.right - event.clientX;
    const clampedRight = Math.min(
      width - MIN_LEFT_PX,
      Math.max(MIN_RIGHT_PX, offsetFromRight),
    );
    setRightFraction(clampedRight / width);
  }, []);

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const leftPercent = (1 - rightFraction) * 100;
  const rightPercent = rightFraction * 100;

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 overflow-x-visible overflow-y-hidden"
    >
      <div
        className="min-h-0 min-w-0 overflow-x-visible overflow-y-hidden"
        style={{ width: `${leftPercent}%` }}
      >
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat panel"
        className="relative z-10 w-1 shrink-0 cursor-col-resize bg-surface-divider transition hover:bg-coach-muted/50"
        onPointerDown={(event) => {
          event.preventDefault();
          draggingRef.current = true;
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
      />
      <div
        className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-glass-border"
        style={{ width: `${rightPercent}%` }}
      >
        {right}
      </div>
    </div>
  );
}
