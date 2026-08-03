import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { OverlayScrollChrome } from "./overlay-scroll-chrome";
import { PageHeader } from "./page-header";
import { tallDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/OverlayScrollChrome",
  component: OverlayScrollChrome,
  tags: ["autodocs"],
  decorators: [tallDecorator],
} satisfies Meta<typeof OverlayScrollChrome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <OverlayScrollChrome
      topChrome={<PageHeader title="Overlay chrome" description="Fixed header and footer blur zones." />}
      footer={<Button fullWidth={false}>Continue</Button>}
    >
      {({ scrollPaddingTop, scrollPaddingBottom }) => (
        <div
          className="absolute inset-0 overflow-y-auto px-6"
          style={{ scrollPaddingTop, scrollPaddingBottom }}
        >
          <div className="space-y-3 py-4">
            {Array.from({ length: 12 }, (_, index) => (
              <div
                key={index}
                className="rounded-card border border-glass-border bg-glass p-4 text-sm text-surface-muted"
              >
                Scroll region item {index + 1}
              </div>
            ))}
          </div>
        </div>
      )}
    </OverlayScrollChrome>
  ),
};
