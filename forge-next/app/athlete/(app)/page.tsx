import { redirect } from "next/navigation";
import { AthleteLinkForm } from "@/components/athlete-link-form";
import { AthleteLinkPendingView } from "@/components/athlete-link-pending-view";
import { NoPlanAssignedView } from "@/components/no-plan-assigned-view";
import { requireRole } from "@/lib/auth/session";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { getAthleteCoachLink } from "@/lib/links/repository";

export default async function AthletePage() {
  const user = await requireRole("athlete");
  const link = await getAthleteCoachLink();

  if (!link) {
    return (
      <main className="mx-auto flex min-h-full max-w-3xl flex-1 items-center justify-center p-4 md:p-8">
        <AthleteLinkForm />
      </main>
    );
  }

  if (link.status === "pending") {
    return (
      <main className="mx-auto flex min-h-full max-w-3xl flex-col p-4 md:p-8">
        <AthleteLinkPendingView link={link} />
      </main>
    );
  }

  const activePlan = await getActiveAthletePlan(user.id);
  if (activePlan) {
    redirect("/athlete/plan");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <NoPlanAssignedView />
    </main>
  );
}
