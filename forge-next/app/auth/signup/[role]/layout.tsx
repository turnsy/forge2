import { notFound } from "next/navigation";
import { isUserRole } from "@/lib/auth/redirects";
import { establishSignupRole } from "@/lib/auth/signup";

export default async function SignupRoleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ role: string }>;
}>) {
  const { role } = await params;

  if (!isUserRole(role)) {
    notFound();
  }

  await establishSignupRole(role);

  return children;
}
