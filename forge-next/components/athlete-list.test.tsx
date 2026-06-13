import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AthleteListRow } from "@/components/athlete-list";
import type { CoachAthleteListItem } from "@/lib/athletes/types";

function athlete(overrides: Partial<CoachAthleteListItem> = {}): CoachAthleteListItem {
  return {
    id: "athlete-1",
    name: "Alex Rivera",
    email: "alex@example.com",
    currentPlanId: "plan-1",
    currentPlanName: "4-Week Strength Block",
    completionPercent: null,
    joinedAt: "2026-01-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("AthleteListRow", () => {
  it("shows a completion badge when the athlete has a plan and percent", () => {
    const { container } = render(
      <AthleteListRow
        athlete={athlete({ completionPercent: 32 })}
        appearIndex={0}
      />,
    );

    expect(screen.getAllByRole("img", { name: "32% complete" })).toHaveLength(2);
    expect(screen.getAllByText("32%")).toHaveLength(2);
    expect(screen.getByText("4-Week Strength Block")).toBeInTheDocument();
    expect(container.querySelector(".md\\:hidden")).toHaveAttribute(
      "aria-label",
      "32% complete",
    );
    expect(container.querySelector(".hidden.md\\:contents")).toContainElement(
      screen.getAllByRole("img", { name: "32% complete" })[1],
    );
  });

  it("shows No plan without a badge when there is no active plan", () => {
    render(
      <AthleteListRow
        athlete={athlete({
          currentPlanId: null,
          currentPlanName: null,
          completionPercent: null,
        })}
        appearIndex={0}
      />,
    );

    expect(screen.getByText("No plan")).toBeInTheDocument();
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("omits the badge when percent is null but a plan name exists", () => {
    render(
      <AthleteListRow
        athlete={athlete({ completionPercent: null })}
        appearIndex={0}
      />,
    );

    expect(screen.getByText("4-Week Strength Block")).toBeInTheDocument();
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });
});
