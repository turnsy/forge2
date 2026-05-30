const defaultClassName = "h-3.5 w-3.5 shrink-0";

export function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`${defaultClassName}${className ? ` ${className}` : ""}`}
      fill="none"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 7.5L6 4.5L9 7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
