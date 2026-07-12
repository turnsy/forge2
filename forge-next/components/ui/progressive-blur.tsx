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

/** Scrim bands mirror blur layer masks so tint ramps with blur strength. */
const PROGRESSIVE_SCRIM_LAYERS: Array<{
  scrimClass: string;
  from: string;
  to: string;
}> = [
  { scrimClass: "bg-surface/6", from: "0%", to: "12.5%" },
  { scrimClass: "bg-surface/10", from: "12.5%", to: "25%" },
  { scrimClass: "bg-surface/14", from: "25%", to: "37.5%" },
  { scrimClass: "bg-surface/18", from: "37.5%", to: "50%" },
  { scrimClass: "bg-surface/24", from: "50%", to: "62.5%" },
  { scrimClass: "bg-surface/32", from: "62.5%", to: "75%" },
  { scrimClass: "bg-surface/40", from: "75%", to: "100%" },
];

function progressiveEffectMask(
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
          key={`blur-${direction}-${layer.from}-${layer.to}`}
          className={`absolute inset-0 ${layer.blurClass}`}
          style={{
            maskImage: progressiveEffectMask(direction, layer.from, layer.to),
            WebkitMaskImage: progressiveEffectMask(
              direction,
              layer.from,
              layer.to,
            ),
          }}
        />
      ))}
      {PROGRESSIVE_SCRIM_LAYERS.map((layer) => (
        <div
          key={`scrim-${direction}-${layer.from}-${layer.to}`}
          className={`absolute inset-0 ${layer.scrimClass}`}
          style={{
            maskImage: progressiveEffectMask(direction, layer.from, layer.to),
            WebkitMaskImage: progressiveEffectMask(
              direction,
              layer.from,
              layer.to,
            ),
          }}
        />
      ))}
    </div>
  );
}
