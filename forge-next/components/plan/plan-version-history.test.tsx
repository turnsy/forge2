import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanVersionHistory } from "@/components/plan/plan-version-history";

describe("PlanVersionHistory", () => {
  it("renders versions with active badge", () => {
    render(
      <PlanVersionHistory
        versions={[
          {
            id: "v2",
            changeSummary: null,
            createdAt: "2026-01-02T00:00:00.000Z",
            createdBy: "coach-1",
            isActive: true,
          },
          {
            id: "v1",
            changeSummary: "Initial save",
            createdAt: "2026-01-01T00:00:00.000Z",
            createdBy: "coach-1",
            isActive: false,
          },
        ]}
      />,
    );

    expect(screen.getByText("Version history")).toBeInTheDocument();
    expect(screen.getByText("Initial save")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders nothing when versions are empty", () => {
    const { container } = render(<PlanVersionHistory versions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
