import { notFound, redirect } from "next/navigation";

export default async function CoachAthleteMaxesPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;
  if (!athleteId) {
    notFound();
  }

  redirect(`/coach/athletes/${athleteId}?tab=maxes`);
}
