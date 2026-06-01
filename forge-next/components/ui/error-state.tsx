import type { ReactNode } from "react";
import { messageToneClass } from "@/lib/theme";

export function ErrorState({
  title,
  description,
  details,
  action,
}: {
  title: string;
  description?: string;
  details?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${messageToneClass("error")}`}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm">{description}</p> : null}
      {details ? (
        <div className="mt-4 w-full max-w-2xl text-left text-sm">{details}</div>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
