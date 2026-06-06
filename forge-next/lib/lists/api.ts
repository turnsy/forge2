import { normalizeListQuery } from "@/lib/lists/query";
import type { ListQuery } from "@/lib/lists/types";

export function listQueryFromUrl(url: URL): ListQuery {
  return normalizeListQuery({
    q: url.searchParams.get("q"),
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
  });
}
