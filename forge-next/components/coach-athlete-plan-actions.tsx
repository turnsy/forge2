"use client";

import { useState } from "react";
import { AthleteAssignPlanModal } from "@/components/athlete-assign-plan-modal";
import { Button } from "@/components/ui";
import type { CoachAthleteRelationship } from "@/lib/links/types";

export function CoachAthletePlanActions({
  relationship,
}: {
  relationship: CoachAthleteRelationship;
}) {
  const [assignOpen, setAssignOpen] = useState(false);
  const planActionLabel = relationship.currentPlanName
    ? "Change plan"
    : "Assign plan";

  if (relationship.status !== "active") {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth={false}
        onClick={() => setAssignOpen(true)}
      >
        {planActionLabel}
      </Button>

      {assignOpen ? (
        <AthleteAssignPlanModal
          athleteId={relationship.athleteId}
          athleteName={relationship.athleteName}
          currentPlanName={relationship.currentPlanName}
          onClose={() => setAssignOpen(false)}
        />
      ) : null}
    </>
  );
}
