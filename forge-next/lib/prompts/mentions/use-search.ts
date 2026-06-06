"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMentionItemGroups } from "@/lib/prompts/mentions/fetch-items";
import type { MentionSearchGroups } from "@/lib/prompts/mentions/search";

const EMPTY_GROUPS: MentionSearchGroups = { athletes: [], plans: [] };
const MENTION_SEARCH_DEBOUNCE_MS = 100;

type MentionSearchSnapshot = {
  groups: MentionSearchGroups;
  inFlight: boolean;
};

const IDLE_SNAPSHOT: MentionSearchSnapshot = {
  groups: EMPTY_GROUPS,
  inFlight: false,
};

export function useMentionSearch(query: string | null, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<MentionSearchSnapshot>(IDLE_SNAPSHOT);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || query === null) {
      return;
    }

    const requestId = ++requestIdRef.current;
    const debounceMs = query.trim().length > 0 ? MENTION_SEARCH_DEBOUNCE_MS : 0;
    const timer = window.setTimeout(() => {
      setSnapshot((current) => ({ ...current, inFlight: true }));

      void fetchMentionItemGroups(query)
        .then((nextGroups) => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setSnapshot({ groups: nextGroups, inFlight: false });
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) {
            return;
          }

          setSnapshot({ groups: EMPTY_GROUPS, inFlight: false });
        });
    }, debounceMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, query]);

  if (!enabled || query === null) {
    return { groups: EMPTY_GROUPS, loading: false };
  }

  return { groups: snapshot.groups, loading: snapshot.inFlight };
}
