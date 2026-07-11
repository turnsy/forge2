import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileComposerToolbar } from "@/components/coach/mobile-composer-toolbar";
import {
  MOBILE_COMPOSER_TOOLBAR_ROW_CLASS,
} from "@/lib/coach/mobile-workspace-layout";

describe("MobileComposerToolbar", () => {
  it("pins the view control on the same row as attachments", () => {
    const { container } = render(
      <MobileComposerToolbar
        attachments={[
          {
            localId: "attach-1",
            status: "uploaded",
            displayLabel: "my plan.csv",
          },
        ]}
        trailing={<button type="button">View</button>}
      />,
    );

    expect(container.firstElementChild?.className).toContain(
      MOBILE_COMPOSER_TOOLBAR_ROW_CLASS,
    );
    expect(
      container.querySelector(".overflow-x-auto"),
    ).not.toBeNull();
    expect(
      container.querySelector(".bg-gradient-to-l"),
    ).not.toBeNull();
    expect(screen.getByText("my plan.csv")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  });

  it("still renders the view control when there are no attachments", () => {
    render(
      <MobileComposerToolbar
        attachments={[]}
        trailing={<button type="button">View</button>}
      />,
    );

    expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument();
  });
});
