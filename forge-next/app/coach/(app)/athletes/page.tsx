import { Suspense } from "react";
import { AthleteList } from "@/components/athlete-list";
import { AthletesPageHeader } from "@/components/athletes-page-header";
import { ListPrevNext } from "@/components/list/list-prev-next";
import { ListSearchField } from "@/components/list/list-search-field";
import { EmptyState, ListSectionSpinner, PageContent } from "@/components/ui";
import { listCoachAthletes } from "@/lib/athletes/repository";
import { normalizeListQuery } from "@/lib/lists/query";
import type { ListQuery } from "@/lib/lists/types";

async function AthletesListSection({ query }: { query: ListQuery }) {
  const result = await listCoachAthletes(query);

  if (result.items.length === 0 && query.q) {
    return (
      <EmptyState
        title={`No results for "${query.q}"`}
        description="Try a different name or clear your search."
      />
    );
  }

  return (
    <>
      <AthleteList athletes={result.items} />
      <ListPrevNext
        pathname="/coach/athletes"
        page={result.page}
        hasMore={result.hasMore}
        q={query.q}
      />
    </>
  );
}

export default async function CoachAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = normalizeListQuery({
    q: params.q,
    page: params.page,
  });

  return (
    <PageContent>
      <AthletesPageHeader />
      <div className="mb-4">
        <ListSearchField
          pathname="/coach/athletes"
          defaultValue={params.q ?? ""}
        />
      </div>
      <Suspense
        key={`${query.q ?? ""}-${query.page}`}
        fallback={<ListSectionSpinner />}
      >
        <AthletesListSection query={query} />
      </Suspense>
    </PageContent>
  );
}
