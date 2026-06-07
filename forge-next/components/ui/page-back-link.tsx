import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { pageBackLinkClass } from "@/lib/theme";

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
      className={`${pageBackLinkClass()}${className ? ` ${className}` : ""}`}
    >
      <ArrowRightIcon className="h-6 w-6 rotate-180" />
    </Link>
  );
}
