export function actualValueClass(matches: boolean | null): string {
  if (matches === true) {
    return "font-bold text-success";
  }

  if (matches === false) {
    return "font-bold text-warning";
  }

  return "font-bold text-surface-foreground";
}

export function PrescribedActualCell({
  prescribed,
  actualValue,
  matches,
}: {
  prescribed: string;
  actualValue: string | null;
  matches: boolean | null;
}) {
  if (!actualValue) {
    return <span>{prescribed}</span>;
  }

  return (
    <div className="flex flex-col gap-0.5 md:inline-flex md:flex-row md:items-baseline md:gap-1">
      <span>{prescribed}</span>
      <span className={actualValueClass(matches)}>({actualValue})</span>
    </div>
  );
}
