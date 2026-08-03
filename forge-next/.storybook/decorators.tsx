import type { Decorator } from "@storybook/nextjs-vite";

export const surfaceDecorator: Decorator = (Story) => (
  <div className="min-h-[12rem] bg-surface p-6 text-surface-foreground">
    <Story />
  </div>
);

export const narrowDecorator: Decorator = (Story) => (
  <div className="mx-auto w-full max-w-md">
    <Story />
  </div>
);

export const wideDecorator: Decorator = (Story) => (
  <div className="mx-auto w-full max-w-3xl">
    <Story />
  </div>
);

export const tallDecorator: Decorator = (Story) => (
  <div className="h-[32rem] bg-surface p-6 text-surface-foreground">
    <Story />
  </div>
);

export const sidebarDecorator: Decorator = (Story) => (
  <nav className="w-56 bg-surface p-2">
    <Story />
  </nav>
);
