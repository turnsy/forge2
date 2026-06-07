import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function CoachPlanEditPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  await requireRole("coach");
  const { planId } = await params;
  redirect(`/coach?planId=${planId}`);
}
