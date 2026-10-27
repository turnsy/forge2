export function CheckmarkIcon({ className = "h-5 w-5 shrink-0" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
