"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui";
import { buildListUrl } from "@/lib/lists/query";

const SEARCH_DEBOUNCE_MS = 300;

export function ListSearchField({
  pathname,
  defaultValue,
}: {
  pathname: string;
  defaultValue: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const syncedQRef = useRef(defaultValue);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue === syncedQRef.current) {
      return;
    }

    const isFocused =
      rootRef.current?.contains(document.activeElement) ?? false;

    if (!isFocused) {
      setValue(defaultValue);
    }

    syncedQRef.current = defaultValue;
  }, [defaultValue]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = value.trim();
      const nextQ = trimmed || undefined;
      const currentQ = syncedQRef.current.trim() || undefined;

      if (nextQ === currentQ) {
        return;
      }

      syncedQRef.current = value;
      router.push(buildListUrl(pathname, { q: nextQ, page: 1 }));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname, router, value]);

  return (
    <div ref={rootRef} data-list-search>
      <Input
        type="search"
        value={value}
        placeholder="Search"
        aria-label="Search"
        onChange={(event) => setValue(event.target.value)}
      />
    </div>
  );
}
