import { AuthBrandHero } from "@/components/auth/auth-brand-hero";
import { AuthPanel } from "@/components/auth/auth-panel";
import type { UserRole } from "@/lib/auth/types";

export function AuthLandingPage({
  initialRole,
  initialBanner,
}: {
  initialRole: UserRole;
  initialBanner?: string | null;
}) {
  return (
    <main className="dark flex min-h-screen flex-col bg-background md:flex-row">
      <AuthBrandHero className="md:w-2/3" />
      <AuthPanel initialRole={initialRole} initialBanner={initialBanner} />
    </main>
  );
}
