import { ButtonLink } from "@/components/ui";
import { buildListUrl } from "@/lib/lists/query";

export function ListPrevNext({
  pathname,
  page,
  hasMore,
  q,
}: {
  pathname: string;
  page: number;
  hasMore: boolean;
  q?: string;
}) {
  if (page <= 1 && !hasMore) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      {page > 1 ? (
        <ButtonLink
          href={buildListUrl(pathname, { q, page: page - 1 })}
          variant="secondary"
          size="sm"
        >
          Previous
        </ButtonLink>
      ) : (
        <span />
      )}
      {hasMore ? (
        <ButtonLink
          href={buildListUrl(pathname, { q, page: page + 1 })}
          variant="secondary"
          size="sm"
        >
          Next
        </ButtonLink>
      ) : (
        <span />
      )}
    </div>
  );
}
