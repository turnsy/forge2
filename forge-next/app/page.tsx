import { redirect } from "next/navigation";
import { AuthLandingPage } from "@/components/auth/auth-landing-page";
import { resolveLoginBanner } from "@/lib/auth/login-banner";
import { getPostAuthRedirect } from "@/lib/auth/redirects";
import { resolveInitialRole } from "@/lib/auth/routes";
import { getAuthUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ role?: string; message?: string; error?: string }>;
}>) {
  const user = await getAuthUser();
  if (user?.role) {
    redirect(getPostAuthRedirect(user.role));
  }

  const query = await searchParams;
  const initialRole = resolveInitialRole(query.role);
  const initialBanner = resolveLoginBanner(query);

  return (
    <AuthLandingPage
      initialRole={initialRole}
      initialBanner={initialBanner}
    />
  );
}
