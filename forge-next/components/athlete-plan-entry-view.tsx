"use client";

import { useState } from "react";
import { AthletePlanMilestoneView } from "@/components/athlete-plan-milestone-view";
import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import {
  type CurrentDayLocation,
  findCurrentDay,
} from "@/lib/athlete/plan/domain";
import {
  dayCompletedMilestone,
  planCompletedMilestone,
  type AthletePlanMilestone,
} from "@/lib/athlete/plan/milestones";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";
import type { DaySelection } from "@/lib/plans/plan-day-navigator";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function AthletePlanEntryView({
  assignmentId,
  plan: initialPlan,
  coachName,
}: {
  assignmentId: string;
  plan: WorkoutPlan;
  coachName: string;
}) {
  const [plan, setPlan] = useState(initialPlan);
  const [milestone, setMilestone] = useState<AthletePlanMilestone | null>(null);
  const [navigateToDay, setNavigateToDay] = useState<DaySelection | undefined>(undefined);

  function handleDayCompleted(
    allDaysDone: boolean,
    completedDay: CurrentDayLocation,
    nextPlan: WorkoutPlan,
  ) {
    setPlan(nextPlan);

    if (allDaysDone) {
      setMilestone(planCompletedMilestone(nextPlan, coachName));
    } else {
      setMilestone(dayCompletedMilestone(completedDay));
    }
  }

  function handleMilestoneDismiss() {
    setMilestone(null);

    setPlan((currentPlan) => {
      const nextDay = findCurrentDay(currentPlan);
      if (nextDay) {
        setNavigateToDay({
          weekIndex: nextDay.weekIndex,
          dayIndex: nextDay.dayIndex,
        });
      }
      return currentPlan;
    });
  }

  if (milestone) {
    return (
      <AthletePlanMilestoneView
        milestone={milestone}
        onDismiss={milestone.kind === "day" ? handleMilestoneDismiss : undefined}
      />
    );
  }

  return (
    <div className={MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS}>
      <PlanDayNavigator
        key={
          navigateToDay
            ? `nav-${navigateToDay.weekIndex}-${navigateToDay.dayIndex}`
            : "default"
        }
        plan={plan}
        view="athlete"
        assignmentId={assignmentId}
        coachName={coachName}
        initialDay={navigateToDay}
        onDayCompleted={handleDayCompleted}
      />
    </div>
  );
}
