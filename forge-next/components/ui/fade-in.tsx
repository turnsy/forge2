import type { CSSProperties, ReactNode } from "react";
import { staggerDelayMs } from "@/lib/motion/stagger";

export function FadeIn({
  index = 0,
  className,
  style,
  children,
}: {
  index?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={`animate-fade-in${className ? ` ${className}` : ""}`}
      style={{ animationDelay: `${staggerDelayMs(index)}ms`, ...style }}
    >
      {children}
    </div>
  );
}
