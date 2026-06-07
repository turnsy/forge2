import Link from "next/link";
import type { ReactNode } from "react";
import { staggerDelayMs } from "@/lib/motion/stagger";

const metaWidthClass = {
  2: "md:w-72",
  3: "md:w-[26rem]",
} as const;

const metaGridClass = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
} as const;

const mainContentClass =
  "grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6";

const interactiveClass =
  "rounded-[calc(var(--radius-card)-0.25rem)] transition hover:bg-glass-focus/40 md:-m-1 md:p-1";

export function List({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-3">{children}</ul>;
}

export function ListRow({
  href,
  leading,
  meta,
  metaColumns = 2,
  actions,
  appearIndex = 0,
  transitionTypes,
}: {
  href?: string;
  leading?: ReactNode;
  meta?: ReactNode;
  metaColumns?: 2 | 3;
  actions?: ReactNode;
  appearIndex?: number;
  transitionTypes?: string[];
}) {
  const metaContent = meta ? (
    <dl
      className={`grid shrink-0 gap-x-6 gap-y-4 ${metaGridClass[metaColumns]} ${metaWidthClass[metaColumns]}`}
    >
      {meta}
    </dl>
  ) : null;

  const mainContent = (
    <>
      {leading ? <div className="min-w-0">{leading}</div> : null}
      {metaContent}
    </>
  );

  return (
    <li
      className="list-none animate-fade-in"
      style={{ animationDelay: `${staggerDelayMs(appearIndex)}ms` }}
    >
      <article
        className={`grid grid-cols-1 items-center gap-4 rounded-card border border-glass-border bg-glass p-4 shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md md:gap-6 ${
          actions ? "md:grid-cols-[minmax(0,1fr)_auto]" : ""
        }`}
      >
        {href ? (
          <Link
            href={href}
            transitionTypes={transitionTypes}
            className={`${mainContentClass} ${interactiveClass}`}
          >
            {mainContent}
          </Link>
        ) : (
          <div className={mainContentClass}>{mainContent}</div>
        )}
        {actions ? <div className="relative z-10 shrink-0 md:justify-self-end">{actions}</div> : null}
      </article>
    </li>
  );
}
