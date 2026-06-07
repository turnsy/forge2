"use client";

import { useEffect, type ReactNode } from "react";

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

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`relative z-10 flex max-h-[calc(100dvh-2rem)] w-full ${sizeClass[size]} flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900`}
        >
          <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
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

          <div
            className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`.trim()}
          >
            {children}
          </div>

          {footer ? <div className="mt-4 shrink-0">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
