import { SignOutButton } from "@/components/auth/sign-out-button";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { GearIcon } from "@/components/icons/gear-icon";
import { SidebarNavLink } from "@/components/ui/sidebar-nav-link";

function ForgeLogo() {
  return (
    <div
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-coach-border bg-coach-muted/30 text-sm font-bold text-coach"
    >
      F
    </div>
  );
}

export function CoachSidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-divider bg-surface text-surface-foreground">
      <div className="flex items-center gap-3 border-b border-surface-divider px-5 py-5">
        <ForgeLogo />
        <span className="text-lg font-semibold tracking-tight">Forge</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <SidebarNavLink href="/coach">Home</SidebarNavLink>
        <SidebarNavLink href="/coach/plans">Plans</SidebarNavLink>
        <SidebarNavLink href="/coach/athletes">Athletes</SidebarNavLink>
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-surface-divider px-3 py-4">
        <SidebarNavLink href="/coach/settings" icon={<GearIcon className="h-4 w-4" />}>
          Settings
        </SidebarNavLink>
        <SignOutButton
          className="flex w-full items-center justify-between gap-3 rounded-control px-4 py-2.5 text-sm font-medium text-surface-muted transition hover:bg-glass hover:text-surface-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coach/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          trailingIcon={<ArrowRightIcon className="h-4 w-4" />}
        />
      </div>
    </aside>
  );
}
