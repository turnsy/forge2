import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageBackGutter } from "./page-back-gutter";
import { PageHeader } from "./page-header";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/PageBackGutter",
  component: PageBackGutter,
  tags: ["autodocs"],
  decorators: [wideDecorator],
  args: {
    back: {
      href: "/coach/plans",
      ariaLabel: "Back to plans",
    },
  },
} satisfies Meta<typeof PageBackGutter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <PageBackGutter {...args}>
      <PageHeader title="Plan details" description="Review sessions and progression." />
    </PageBackGutter>
  ),
};
