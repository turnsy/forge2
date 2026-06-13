type CompletionProgressRingProps = {
  percent: number;
  className?: string;
  size?: number;
};

function clampPercent(percent: number): number {
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function CompletionProgressRing({
  percent,
  className,
  size = 36,
}: CompletionProgressRingProps) {
  const value = clampPercent(percent);
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (value / 100) * circumference;
  const center = size / 2;

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
          className="stroke-emerald-500"
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
