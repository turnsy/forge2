"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui";
import { buildListUrl } from "@/lib/lists/query";

const SEARCH_DEBOUNCE_MS = 300;

export function ListSearchField({
  pathname,
  defaultValue,
  placeholder,
}: {
  pathname: string;
  defaultValue: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextUrl = buildListUrl(pathname, {
        q: value.trim() || undefined,
        page: 1,
      });
      const currentUrl = buildListUrl(pathname, {
        q: defaultValue.trim() || undefined,
        page: 1,
      });

      if (nextUrl !== currentUrl) {
        router.push(nextUrl);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [defaultValue, pathname, router, value]);

  return (
    <Input
      type="search"
      value={value}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}
