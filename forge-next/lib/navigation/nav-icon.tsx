import {
  AthletesIcon,
  HistoryIcon,
  HomeIcon,
  MaxesIcon,
  PlansIcon,
  SettingsNavIcon,
} from "@/components/icons/sidebar-nav-icons";
import type { SidebarNavIcon } from "@/lib/navigation/role-nav";

export function renderNavIcon(icon: SidebarNavIcon) {
  switch (icon) {
    case "home":
      return <HomeIcon />;
    case "plans":
      return <PlansIcon />;
    case "athletes":
      return <AthletesIcon />;
    case "maxes":
      return <MaxesIcon />;
    case "history":
      return <HistoryIcon />;
    case "settings":
      return <SettingsNavIcon />;
  }
}
