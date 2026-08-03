import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MetaGroup } from "./meta-group";
import { MetaItem } from "./meta-item";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/MetaItem",
  component: MetaItem,
  tags: ["autodocs"],
  decorators: [wideDecorator],
  args: {
    label: "Duration",
    value: "45 min",
  },
} satisfies Meta<typeof MetaItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Group: Story = {
  render: () => (
    <MetaGroup>
      <div className="grid gap-6 sm:grid-cols-3">
        <MetaItem label="Duration" value="45 min" />
        <MetaItem label="Sessions" value="3 / week" />
        <MetaItem label="Status" value="Published" />
      </div>
    </MetaGroup>
  ),
};
