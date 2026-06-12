import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionGroup } from "@/components/ui/action-group";
import { Button } from "@/components/ui/button";

describe("ActionGroup", () => {
  it("stacks list actions vertically on small screens", () => {
    const { container } = render(
      <ActionGroup>
        <Button type="button" size="sm">
          Assign
        </Button>
        <Button type="button" variant="danger" size="sm">
          Delete
        </Button>
      </ActionGroup>,
    );

    const group = container.firstElementChild;
    expect(group?.className).toContain("flex-col");
    expect(group?.className).toContain("w-full");
    expect(group?.className).toContain("[&_button]:w-full");
  });
});
