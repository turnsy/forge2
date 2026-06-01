import Image from "next/image";

const LOGO_WIDTH = 958;
const LOGO_HEIGHT = 259;

const sizeClasses = {
  hero: "h-10 w-auto sm:h-12",
  sidebar: "h-7 w-auto",
} as const;

export function ForgeLogo({
  size = "hero",
  className,
}: {
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <Image
      alt="Forge"
      className={[sizeClasses[size], className].filter(Boolean).join(" ")}
      height={LOGO_HEIGHT}
      priority={size === "hero"}
      src="/forge-logo.png"
      width={LOGO_WIDTH}
    />
  );
}
