import { ForgeLogo } from "@/components/forge-logo";
import { AuthPanel } from "@/components/auth/auth-panel";
import { authLandingClass } from "@/lib/theme";
import type { UserRole } from "@/lib/auth/types";

export function AuthLandingPage({
  initialRole,
  initialBanner,
}: {
  initialRole: UserRole;
  initialBanner?: string | null;
}) {
  return (
    <main className={authLandingClass()}>
      <div className="flex w-full max-w-sm flex-col items-center gap-10">
        <h1 aria-label="Forge" className="text-surface-foreground">
          <ForgeLogo variant="horizontal" size="sidebar" />
        </h1>
        <AuthPanel initialRole={initialRole} initialBanner={initialBanner} />
      </div>
    </main>
  );
}
