import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListRow, MetaGroup, MetaItem } from "@/components/ui";

describe("ListRow", () => {
  it("keeps column meta aligned in a fixed grid track on desktop", () => {
    const { container } = render(
      <ListRow
        metaLayout="column"
        metaColumns={1}
        leading={<h2>Short plan</h2>}
        meta={
          <MetaGroup>
            <MetaItem label="Completed" value="Jun 12, 2026" />
          </MetaGroup>
        }
        actions={<span>Completed</span>}
      />,
    );

    expect(container.querySelector("article")?.className).toContain(
      "md:grid-cols-[minmax(0,1fr)_7.5rem_auto]",
    );
    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Jun 12, 2026")).toBeInTheDocument();
  });
});
