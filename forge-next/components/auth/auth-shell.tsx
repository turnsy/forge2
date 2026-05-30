import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
      <div className="dark flex w-full max-w-md flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-zinc-50 shadow-sm">
        <header className="space-y-3 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-sm leading-6 text-zinc-400">{description}</p>
          ) : null}
        </header>
        {children}
        {footer ? (
          <footer className="border-t border-zinc-800 pt-4 text-sm text-zinc-400">
            {footer}
          </footer>
        ) : null}
      </div>
    </main>
  );
}
