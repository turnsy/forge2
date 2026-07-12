type ProgressiveBlurDirection = "top" | "bottom";

const PROGRESSIVE_BLUR_LAYERS: Array<{
  blurClass: string;
  from: string;
  to: string;
}> = [
  { blurClass: "backdrop-blur-[2px]", from: "0%", to: "12.5%" },
  { blurClass: "backdrop-blur-[4px]", from: "12.5%", to: "25%" },
  { blurClass: "backdrop-blur-[8px]", from: "25%", to: "37.5%" },
  { blurClass: "backdrop-blur-[16px]", from: "37.5%", to: "50%" },
  { blurClass: "backdrop-blur-[24px]", from: "50%", to: "62.5%" },
  { blurClass: "backdrop-blur-[40px]", from: "62.5%", to: "75%" },
  { blurClass: "backdrop-blur-[64px]", from: "75%", to: "100%" },
];

const PROGRESSIVE_SCRIM_CLASS: Record<ProgressiveBlurDirection, string> = {
  top: "bg-gradient-to-b from-surface/75 via-surface/35 to-transparent",
  bottom: "bg-gradient-to-t from-surface/75 via-surface/35 to-transparent",
};

function progressiveBlurMask(
  direction: ProgressiveBlurDirection,
  from: string,
  to: string,
): string {
  const axis = direction === "bottom" ? "to bottom" : "to top";
  return `linear-gradient(${axis}, transparent ${from}, black ${to})`;
}

export function ProgressiveBlur({
  direction,
  className = "",
}: {
  direction: ProgressiveBlurDirection;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none overflow-hidden${className ? ` ${className}` : ""}`}
    >
      {PROGRESSIVE_BLUR_LAYERS.map((layer) => (
        <div
          key={`${direction}-${layer.from}-${layer.to}`}
          className={`absolute inset-0 ${layer.blurClass}`}
          style={{
            maskImage: progressiveBlurMask(direction, layer.from, layer.to),
            WebkitMaskImage: progressiveBlurMask(direction, layer.from, layer.to),
          }}
        />
      ))}
      <div className={`absolute inset-0 ${PROGRESSIVE_SCRIM_CLASS[direction]}`} />
    </div>
  );
}
