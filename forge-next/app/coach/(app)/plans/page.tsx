import { Suspense } from "react";
import { ListPrevNext } from "@/components/list/list-prev-next";
import { ListSearchField } from "@/components/list/list-search-field";
import { PlanList } from "@/components/plan-list";
import { PlansPageHeader } from "@/components/plans-page-header";
import { EmptyState, ListSectionSpinner, PageContent } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { normalizeListQuery } from "@/lib/lists/query";
import type { ListQuery } from "@/lib/lists/types";
import { listCoachPlans } from "@/lib/plans/repository";

async function PlansListSection({
  coachId,
  query,
}: {
  coachId: string;
  query: ListQuery;
}) {
  const result = await listCoachPlans(coachId, query);

  if (result.items.length === 0 && query.q) {
    return (
      <EmptyState
        title={`No results for "${query.q}"`}
        description="Try a different title or clear your search."
      />
    );
  }

  return (
    <>
      <PlanList plans={result.items} />
      <ListPrevNext
        pathname="/coach/plans"
        page={result.page}
        hasMore={result.hasMore}
        q={query.q}
      />
    </>
  );
}

export default async function CoachPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireRole("coach");
  const params = await searchParams;
  const query = normalizeListQuery({
    q: params.q,
    page: params.page,
  });

  return (
    <PageContent>
      <PlansPageHeader />
      <div className="mb-4">
        <ListSearchField
          pathname="/coach/plans"
          defaultValue={params.q ?? ""}
        />
      </div>
      <Suspense
        key={`${query.q ?? ""}-${query.page}`}
        fallback={<ListSectionSpinner />}
      >
        <PlansListSection coachId={user.id} query={query} />
      </Suspense>
    </PageContent>
  );
}
