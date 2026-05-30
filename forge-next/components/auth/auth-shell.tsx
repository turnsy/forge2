import type { ReactNode } from "react";
import type { UserRole } from "@/lib/auth/types";

const roleBorderStyles: Record<UserRole, string> = {
  coach: "border-red-500/25",
  athlete: "border-green-500/25",
};

export function AuthShell({
  title,
  description,
  role,
  children,
  footer,
}: {
  title: ReactNode;
  description?: string;
  role?: UserRole;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const borderStyle = role ? roleBorderStyles[role] : "border-zinc-800";

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 sm:p-8">
      <div
        className={`dark flex w-full max-w-md flex-col gap-6 rounded-2xl border bg-zinc-950 p-8 text-zinc-50 shadow-sm ${borderStyle}`}
      >
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
