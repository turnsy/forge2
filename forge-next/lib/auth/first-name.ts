export function firstName(
  fullName: string | null | undefined,
  fallback = "there",
): string {
  if (!fullName?.trim()) {
    return fallback;
  }

  return fullName.trim().split(/\s+/)[0] ?? fallback;
}
