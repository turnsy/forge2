import { useEffect } from "react";
import type { Preview, Decorator } from "@storybook/nextjs-vite";
import "@/app/globals.css";
import { surfaceDecorator } from "./decorators";

const ThemeDecorator: Decorator = (Story, context) => {
  const theme = context.globals.theme;
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  return <Story />;
};

const preview: Preview = {
  decorators: [ThemeDecorator, surfaceDecorator],
  globalTypes: {
    theme: {
      description: "Forge appearance",
      toolbar: {
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "system", title: "System" },
        ],
      },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: {
    layout: "padded",
    options: { storySort: { order: ["Design System", "UI"] } },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    nextjs: { appDirectory: true, navigation: { pathname: "/coach" } },
    a11y: { test: "todo" },
  },
};
export default preview;
