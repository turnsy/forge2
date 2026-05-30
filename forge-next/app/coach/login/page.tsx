import { RoleLoginPage } from "@/components/auth/role-login-page";

export default function CoachLoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ message?: string; error?: string }>;
}>) {
  return <RoleLoginPage role="coach" searchParams={searchParams} />;
}
