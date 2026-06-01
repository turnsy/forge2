"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronUpIcon } from "@/components/icons/chevron-up-icon";
import { accordionClass, accordionNestedClass } from "@/lib/theme";

export type AccordionVariant = "default" | "nested";

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className ?? "space-y-4"}>{children}</div>;
}

export function AccordionItem({
  title,
  meta,
  description,
  children,
  defaultOpen = false,
  variant = "default",
}: {
  title: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  variant?: AccordionVariant;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const buttonId = useId();
  const surfaceClass = variant === "nested" ? accordionNestedClass() : accordionClass();

  return (
    <div className={surfaceClass}>
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-4 text-left"
      >
        <div className="min-w-0 flex-1">
          {title}
          {description ? <div className="mt-2">{description}</div> : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
        <ChevronUpIcon
          className={`mt-1 text-surface-muted transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden" aria-hidden={!open}>
          <div
            className={`border-t border-glass-border pt-4 motion-reduce:transition-none ${
              open ? "mt-4 opacity-100" : "mt-0 opacity-0"
            } transition-[margin,opacity] duration-300 ease-in-out`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
