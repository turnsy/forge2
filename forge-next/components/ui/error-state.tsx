import type { ReactNode } from "react";
import {
  errorStateClass,
  statePanelDescriptionClass,
  statePanelTitleClass,
} from "@/lib/theme";

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
    <div role="alert" className={errorStateClass()}>
      <h2 className={statePanelTitleClass()}>{title}</h2>
      {description ? (
        <p className={statePanelDescriptionClass()}>{description}</p>
      ) : null}
      {details ? (
        <div className="mt-4 w-full max-w-2xl text-left text-sm">{details}</div>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
