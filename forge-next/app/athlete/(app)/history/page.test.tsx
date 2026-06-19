import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/session", () => ({
  requireRole: vi.fn(async () => ({
    id: "athlete-1",
    email: "athlete@example.com",
    role: "athlete",
    fullName: "Athlete One",
  })),
}));

vi.mock("@/lib/athlete/plan/repository", () => ({
  listMyPlanHistory: vi.fn(),
}));

vi.mock("@/components/athlete-plan-history-view", () => ({
  AthletePlanHistoryView: ({ plans }: { plans: { id: string }[] }) => (
    <div>History plans: {plans.length}</div>
  ),
}));

import AthleteHistoryPage from "@/app/athlete/(app)/history/page";
import { listMyPlanHistory } from "@/lib/athlete/plan/repository";

const mockListMyPlanHistory = vi.mocked(listMyPlanHistory);

describe("AthleteHistoryPage", () => {
  it("renders plan history when data loads", async () => {
    mockListMyPlanHistory.mockResolvedValue({
      ok: true,
      plans: [{ id: "assignment-1" } as never],
    });

    const ui = await AthleteHistoryPage();
    render(ui);

    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("History plans: 1")).toBeInTheDocument();
  });

  it("shows empty history state through the history view", async () => {
    mockListMyPlanHistory.mockResolvedValue({ ok: true, plans: [] });

    const ui = await AthleteHistoryPage();
    render(ui);

    expect(screen.getByText("History plans: 0")).toBeInTheDocument();
  });

  it("shows an error state when loading fails", async () => {
    mockListMyPlanHistory.mockResolvedValue({
      ok: false,
      code: "db_error",
      message: "connection failed",
    });

    const ui = await AthleteHistoryPage();
    render(ui);

    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't load history");
    expect(screen.getByText("connection failed")).toBeInTheDocument();
  });
});
