import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tab, TabList, TabPanel, Tabs } from "./tabs";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  decorators: [wideDecorator],
  args: {
    defaultTab: "overview",
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tabs defaultTab={args.defaultTab}>
      <TabList>
        <Tab id="overview">Overview</Tab>
        <Tab id="sessions">Sessions</Tab>
        <Tab id="notes">Notes</Tab>
      </TabList>
      <TabPanel id="overview">
        <p className="text-sm text-surface-muted">Plan summary and athlete assignment status.</p>
      </TabPanel>
      <TabPanel id="sessions">
        <p className="text-sm text-surface-muted">Weekly session breakdown and progression.</p>
      </TabPanel>
      <TabPanel id="notes">
        <p className="text-sm text-surface-muted">Coach notes visible only to staff.</p>
      </TabPanel>
    </Tabs>
  ),
};
