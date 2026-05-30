export function profileLabels(
  fullName: string | null,
  email: string | undefined,
) {
  const displayName = fullName ?? email ?? "Account";
  const displayEmail = fullName && email ? email : undefined;

  return { displayName, displayEmail };
}
