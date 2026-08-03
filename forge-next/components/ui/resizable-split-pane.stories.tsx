import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ResizableSplitPane } from "./resizable-split-pane";
import { tallDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/ResizableSplitPane",
  component: ResizableSplitPane,
  tags: ["autodocs"],
  decorators: [tallDecorator],
} satisfies Meta<typeof ResizableSplitPane>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ResizableSplitPane
      left={
        <div className="flex h-full items-center justify-center rounded-card border border-glass-border bg-glass p-6 text-sm text-surface-muted">
          Main workspace
        </div>
      }
      right={
        <div className="flex h-full flex-col gap-3 p-4">
          <p className="text-sm font-medium text-surface-foreground">Chat panel</p>
          <p className="text-sm text-surface-muted">
            Drag the divider to resize the side panel.
          </p>
        </div>
      }
    />
  ),
};
