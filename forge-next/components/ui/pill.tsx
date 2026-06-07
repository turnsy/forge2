import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { pillClass, type PillTone } from "@/lib/theme";

export function Pill({
  href,
  children,
  tone = "default",
  className,
  transitionTypes,
}: {
  href?: string;
  children: ReactNode;
  tone?: PillTone;
  className?: string;
  transitionTypes?: string[];
} & Omit<ComponentProps<typeof Link>, "href" | "children" | "className">) {
  const classes = `${pillClass(tone)}${className ? ` ${className}` : ""}`;

  if (href) {
    return (
      <Link href={href} transitionTypes={transitionTypes} className={classes}>
        {children}
      </Link>
    );
  }

  return <span className={classes}>{children}</span>;
}
