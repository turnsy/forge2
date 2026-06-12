import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AthletePlanCompleteView } from "@/components/athlete-plan-complete-view";

describe("AthletePlanCompleteView", () => {
  it("renders celebration state with plan and coach details", () => {
    render(
      <AthletePlanCompleteView planName="4-Week Block" coachName="Coach Alex" />,
    );

    expect(screen.getByText("All workouts complete! 🎉")).toBeInTheDocument();
    expect(screen.getByText("4-Week Block with Coach Alex")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute(
      "href",
      "/athlete",
    );
  });
});
