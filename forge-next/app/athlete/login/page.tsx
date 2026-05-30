import { RoleLoginPage } from "@/components/auth/role-login-page";

export default function AthleteLoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ message?: string; error?: string }>;
}>) {
  return <RoleLoginPage role="athlete" searchParams={searchParams} />;
}
