import type { ReactNode } from "react";
import { Button } from "@/components/ui";

export function SignOutButton({
  className,
  trailingIcon,
}: {
  className?: string;
  trailingIcon?: ReactNode;
}) {
  const label = trailingIcon ? (
    <span className="flex w-full items-center justify-between gap-3">
      <span>Log out</span>
      {trailingIcon}
    </span>
  ) : (
    "Log out"
  );

  return (
    <form action="/auth/logout" method="post" className={trailingIcon ? "w-full" : undefined}>
      <Button
        type="submit"
        variant="ghost"
        fullWidth={false}
        className={className}
      >
        {label}
      </Button>
    </form>
  );
}
