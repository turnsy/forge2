import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeIcon, PlansIcon } from "@/components/icons/sidebar-nav-icons";
import { SidebarNavLink } from "./sidebar-nav-link";
import { sidebarDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/SidebarNavLink",
  component: SidebarNavLink,
  tags: ["autodocs"],
  decorators: [sidebarDecorator],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/coach/plans",
      },
    },
  },
  args: {
    href: "/coach/plans",
    icon: <PlansIcon />,
    children: "Plans",
  },
} satisfies Meta<typeof SidebarNavLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {};

export const Active: Story = {
  args: {
    href: "/coach",
    icon: <HomeIcon />,
    children: "Home",
    exact: true,
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/coach",
      },
    },
  },
};

export const Collapsed: Story = {
  args: {
    collapsed: true,
  },
};
