import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AthletePlanMilestoneView } from "@/components/athlete-plan-milestone-view";
import {
  dayCompletedMilestone,
  planCompletedMilestone,
} from "@/lib/athlete/plan/milestones";
import type { CurrentDayLocation } from "@/lib/athlete/plan/domain";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const currentDay: CurrentDayLocation = {
  weekIndex: 1,
  dayIndex: 1,
  week: minimalWorkoutPlan.weeks[0],
  day: minimalWorkoutPlan.weeks[0].days[0],
};

describe("AthletePlanMilestoneView", () => {
  it("renders day completed state", () => {
    render(<AthletePlanMilestoneView milestone={dayCompletedMilestone(currentDay)} />);

    expect(screen.getByText("Day completed!")).toBeInTheDocument();
    expect(screen.getByText("Week 1 · Day 1")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders plan celebration state", () => {
    render(
      <AthletePlanMilestoneView
        milestone={planCompletedMilestone(minimalWorkoutPlan, "Coach Alex")}
      />,
    );

    expect(screen.getByText("All workouts complete!")).toBeInTheDocument();
    expect(screen.getByText("4-Week Strength Block with Coach Alex")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
