import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { EllipsisIcon } from "@/components/icons/ellipsis-icon";
import { IconButton } from "./icon-button";
import { Dropdown, DropdownItem } from "./dropdown";

const meta = {
  title: "UI/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
  args: {
    menuLabel: "Plan actions",
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Dropdown
      {...args}
      trigger={({ open, toggle, menuId }) => (
        <IconButton
          aria-label="Open plan actions"
          aria-expanded={open}
          aria-controls={menuId}
          variant="plain"
          size="sm"
          icon={<EllipsisIcon />}
          onClick={toggle}
        />
      )}
    >
      <DropdownItem onSelect={fn()}>Duplicate</DropdownItem>
      <DropdownItem onSelect={fn()}>Archive</DropdownItem>
      <DropdownItem destructive onSelect={fn()}>
        Delete
      </DropdownItem>
    </Dropdown>
  ),
};
