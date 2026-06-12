import { AthleteCoachLinkView } from "@/components/athlete-coach-link-view";
import { AthleteLinkForm } from "@/components/athlete-link-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  AthletePlanHomeCard,
  NoPlanAssignedView,
} from "@/components/no-plan-assigned-view";
import { ButtonLink } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { getActiveAthletePlan } from "@/lib/athlete/plan/repository";
import { getAthleteCoachLink } from "@/lib/links/repository";

export default async function AthletePage() {
  const user = await requireRole("athlete");
  const [link, activePlan] = await Promise.all([
    getAthleteCoachLink(),
    getActiveAthletePlan(user.id),
  ]);

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 p-4 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Athlete</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {user.fullName ?? user.email ?? user.id}
          </p>
        </div>
        <SignOutButton />
      </div>

      {activePlan ? (
        <AthletePlanHomeCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Current plan</p>
              <p className="mt-1 font-medium">{activePlan.plan.name}</p>
            </div>
            <ButtonLink href="/athlete/plan" variant="primary" size="md">
              View My Plan →
            </ButtonLink>
          </div>
        </AthletePlanHomeCard>
      ) : (
        <NoPlanAssignedView />
      )}

      {link ? (
        <AthleteCoachLinkView link={link} />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <AthleteLinkForm />
        </div>
      )}
    </main>
  );
}
