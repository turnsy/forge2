import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MetaGroup } from "./meta-group";
import { MetaItem } from "./meta-item";

const meta = {
  title: "UI/MetaGroup",
  component: MetaGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof MetaGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <MetaGroup>
      <div className="grid gap-6 sm:grid-cols-2">
        <MetaItem label="Created" value="Aug 3, 2026" />
        <MetaItem label="Owner" value="Coach Riley" />
      </div>
    </MetaGroup>
  ),
};
