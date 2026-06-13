import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";

describe("Tabs", () => {
  it("switches panels when a tab is selected", async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultTab="one">
        <TabList>
          <Tab id="one">One</Tab>
          <Tab id="two">Two</Tab>
        </TabList>
        <TabPanel id="one">First panel</TabPanel>
        <TabPanel id="two">Second panel</TabPanel>
      </Tabs>,
    );

    expect(screen.getByText("First panel")).toBeInTheDocument();
    expect(screen.queryByText("Second panel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Two" }));

    expect(screen.getByText("Second panel")).toBeInTheDocument();
    expect(screen.queryByText("First panel")).not.toBeInTheDocument();
  });
});
