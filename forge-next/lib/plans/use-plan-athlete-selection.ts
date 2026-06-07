"use client";

import { useMemo, useState } from "react";
import type { CoachAthleteListItem } from "@/lib/athletes/types";

export function usePlanAthleteSelection(
  planId: string,
  items: CoachAthleteListItem[],
) {
  const [manualSelectedIds, setManualSelectedIds] = useState<Set<string>>(
    new Set(),
  );
  const [manualDeselectedIds, setManualDeselectedIds] = useState<Set<string>>(
    new Set(),
  );

  const selectedIds = useMemo(() => {
    const ids = new Set(manualSelectedIds);

    for (const athlete of items) {
      if (
        athlete.currentPlanId === planId &&
        !manualDeselectedIds.has(athlete.id)
      ) {
        ids.add(athlete.id);
      }
    }

    return ids;
  }, [items, manualDeselectedIds, manualSelectedIds, planId]);

  function toggleAthlete(athlete: CoachAthleteListItem) {
    const isSelected = selectedIds.has(athlete.id);

    if (isSelected) {
      if (athlete.currentPlanId === planId) {
        setManualDeselectedIds((current) => new Set(current).add(athlete.id));
      }

      setManualSelectedIds((current) => {
        const next = new Set(current);
        next.delete(athlete.id);
        return next;
      });
      return;
    }

    setManualDeselectedIds((current) => {
      if (!current.has(athlete.id)) {
        return current;
      }

      const next = new Set(current);
      next.delete(athlete.id);
      return next;
    });
    setManualSelectedIds((current) => new Set(current).add(athlete.id));
  }

  return { selectedIds, toggleAthlete };
}
