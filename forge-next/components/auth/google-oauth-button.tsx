import { oauthFormAction } from "@/lib/auth/form-actions";
import type { UserRole } from "@/lib/auth/types";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";

export function GoogleOAuthButton({
  label,
  role,
}: {
  label: string;
  role?: UserRole;
}) {
  return (
    <form action={oauthFormAction}>
      <input type="hidden" name="provider" value="google" />
      {role ? <input type="hidden" name="role" value={role} /> : null}
      <AuthSubmitButton pendingLabel="Redirecting…">
        {label}
      </AuthSubmitButton>
    </form>
  );
}
