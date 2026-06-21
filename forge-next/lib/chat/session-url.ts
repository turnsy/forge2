export function syncCoachSessionUrl(sessionId: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);

  if (sessionId) {
    url.searchParams.set("sessionId", sessionId);
  } else {
    url.searchParams.delete("sessionId");
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (next !== current) {
    window.history.replaceState(window.history.state, "", next);
  }
}
