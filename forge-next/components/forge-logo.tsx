import Image from "next/image";

const sizeClasses = {
  hero: "h-8 w-auto",
  sidebar: "h-6 w-auto",
} as const;

export function ForgeLogo({
  size = "hero",
  variant = "mark",
  className,
}: {
  size?: keyof typeof sizeClasses;
  variant?: "horizontal" | "stacked" | "mark";
  className?: string;
}) {
  const dimensions = variant === "stacked"
    ? { width: 121.92, height: 142.08 }
    : { width: 277.333, height: 80 };
  const heightClass = variant === "stacked"
    ? (size === "hero" ? "h-16 w-auto" : "h-12 w-auto")
    : sizeClasses[size];
  const classes = ["shrink-0", heightClass, className].filter(Boolean).join(" ");

  if (variant === "mark") {
    return (
      <svg
        aria-label="Forge"
        role="img"
        viewBox="0 0 80 80"
        width={80}
        height={80}
        className={classes}
        fill="currentColor"
      >
        <path d="M0 0H80L66 18H0ZM0 30H61L47 48H20V80H0Z" />
      </svg>
    );
  }

  return (
    <Image
      alt="Forge"
      className={classes}
      height={dimensions.height}
      priority={size === "hero"}
      src={variant === "stacked" ? "/forge-logo-stacked.svg" : "/forge-logo.svg"}
      width={dimensions.width}
    />
  );
}
