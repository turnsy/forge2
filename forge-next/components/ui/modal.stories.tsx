import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { Button } from "./button";
import { Modal } from "./modal";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Modal",
  component: Modal,
  tags: ["autodocs"],
  decorators: [narrowDecorator],
  args: {
    title: "Delete plan",
    onClose: fn(),
    children: (
      <p className="text-sm text-surface-muted">
        This permanently removes the plan for all assigned athletes.
      </p>
    ),
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: { open: false },
};

export const Open: Story = {
  args: {
    open: true,
    footer: (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" fullWidth={false}>
          Cancel
        </Button>
        <Button variant="danger" fullWidth={false}>
          Delete
        </Button>
      </div>
    ),
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button fullWidth={false} onClick={() => setOpen(true)}>
          Open modal
        </Button>
        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" fullWidth={false} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" fullWidth={false} onClick={() => setOpen(false)}>
                Confirm
              </Button>
            </div>
          }
        />
      </>
    );
  },
};

export const Large: Story = {
  args: {
    open: true,
    size: "large",
    title: "Assign athletes",
  },
};
