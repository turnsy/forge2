import type { Preview } from "@storybook/nextjs-vite";
import "@/app/globals.css";
import { surfaceDecorator } from "./decorators";

const preview: Preview = {
  decorators: [surfaceDecorator],
  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/coach",
      },
    },
    a11y: {
      test: "todo",
    },
  },
};

export default preview;
