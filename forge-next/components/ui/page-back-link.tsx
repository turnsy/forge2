import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { ROUTE_TRANSITION_BACK_TYPES } from "@/lib/motion/route-transitions";
import { iconButtonVariantClass } from "@/lib/theme";

export function PageBackLink({
  href,
  ariaLabel,
  className,
  onClick,
}: {
  href: string;
  ariaLabel: string;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
} & Omit<
  ComponentProps<typeof Link>,
  "href" | "children" | "onClick" | "className" | "aria-label"
>) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      onClick={onClick}
      transitionTypes={[...ROUTE_TRANSITION_BACK_TYPES]}
      className={`${iconButtonVariantClass("ghost", "sm")}${className ? ` ${className}` : ""}`}
    >
      <ArrowRightIcon className="h-4 w-4 rotate-180" />
    </Link>
  );
}
