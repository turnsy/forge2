import type { ReactNode } from "react";
import {
  emptyStateClass,
  statePanelDescriptionClass,
  statePanelTitleClass,
} from "@/lib/theme";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={emptyStateClass()}>
      <h2 className={statePanelTitleClass()}>{title}</h2>
      {description ? (
        <p className={statePanelDescriptionClass()}>{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
