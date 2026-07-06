const defaultClassName = "h-3.5 w-3.5 shrink-0";

export function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`${defaultClassName}${className ? ` ${className}` : ""}`}
      fill="currentColor"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="8" rx="1" width="8" x="2" y="2" />
    </svg>
  );
}
