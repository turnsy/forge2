import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageBackButton, PageBackLink } from "./page-back-link";

const meta = {
  title: "UI/PageBackLink",
  component: PageBackLink,
  tags: ["autodocs"],
  args: {
    href: "/coach/plans",
    ariaLabel: "Back to plans",
  },
} satisfies Meta<typeof PageBackLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Link: Story = {};

export const Button: Story = {
  render: (args) => (
    <PageBackButton ariaLabel={args.ariaLabel} onClick={() => undefined} />
  ),
};
