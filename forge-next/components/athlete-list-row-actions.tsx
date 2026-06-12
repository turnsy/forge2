"use client";

import { useState } from "react";
import { AthleteAssignPlanModal } from "@/components/athlete-assign-plan-modal";
import { ActionGroup, Button } from "@/components/ui";
import type { CoachAthleteListItem } from "@/lib/athletes/types";

export function AthleteListRowActions({
  athlete,
}: {
  athlete: CoachAthleteListItem;
}) {
  const [assignOpen, setAssignOpen] = useState(false);
  const planActionLabel = athlete.currentPlanName ? "Change plan" : "Assign plan";

  return (
    <>
      <ActionGroup>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setAssignOpen(true)}
        >
          {planActionLabel}
        </Button>
      </ActionGroup>

      {assignOpen ? (
        <AthleteAssignPlanModal
          athleteId={athlete.id}
          athleteName={athlete.name}
          currentPlanName={athlete.currentPlanName}
          onClose={() => setAssignOpen(false)}
        />
      ) : null}
    </>
  );
}
