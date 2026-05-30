import { notFound } from "next/navigation";
import { isUserRole } from "@/lib/auth/redirects";

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

  return children;
}
