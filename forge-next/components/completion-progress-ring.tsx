"use client";

import { useEffect, useState } from "react";

type CompletionProgressRingProps = {
  percent: number;
  className?: string;
  size?: number;
};

function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CompletionProgressRing({
  percent,
  className,
  size = 36,
}: CompletionProgressRingProps) {
  const value = clampPercent(percent);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset =
    circumference - (animatedPercent / 100) * circumference;
  const center = size / 2;

  useEffect(() => {
    if (prefersReducedMotion()) {
      setAnimatedPercent(value);
      return;
    }

    setAnimatedPercent(0);
    const frame = window.requestAnimationFrame(() => {
      setAnimatedPercent(value);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={`${value}% complete`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-glass-border"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-emerald-500 transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span className="text-[10px] font-semibold leading-none text-surface-foreground">
        {value}%
      </span>
    </div>
  );
}
