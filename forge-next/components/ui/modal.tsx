"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { OverlayScrollChrome } from "@/components/ui/overlay-scroll-chrome";

const sizeClass = {
  md: "max-w-md",
  lg: "max-w-lg",
  large: "max-w-2xl",
} as const;

export type ModalSize = keyof typeof sizeClass;

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
  bodyClassName = "",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  bodyClassName?: string;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const titleChrome = (
    <div className="flex items-start justify-between gap-4">
      <h2 id="modal-title" className="text-lg font-semibold">
        {title}
      </h2>
      <button
        type="button"
        aria-label="Close"
        className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        onClick={onClose}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-[201] flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`flex max-h-[calc(100dvh-2rem)] w-full ${sizeClass[size]} min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900`}
        >
          <OverlayScrollChrome
            topChrome={titleChrome}
            footer={footer ? <div className="pt-4">{footer}</div> : undefined}
          >
            {({ scrollPaddingTop, scrollPaddingBottom }) => (
              <div
                className={`absolute inset-0 z-0 overflow-y-auto ${bodyClassName}`.trim()}
                style={{
                  ...(scrollPaddingTop !== undefined
                    ? { paddingTop: scrollPaddingTop }
                    : {}),
                  ...(scrollPaddingBottom !== undefined
                    ? { paddingBottom: scrollPaddingBottom }
                    : {}),
                }}
              >
                {children}
              </div>
            )}
          </OverlayScrollChrome>
        </div>
      </div>
    </div>,
    document.body,
  );
}
