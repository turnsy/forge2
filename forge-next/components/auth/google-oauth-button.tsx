import { oauthFormAction } from "@/lib/auth/form-actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";

export function GoogleOAuthButton({ label }: { label: string }) {
  return (
    <form action={oauthFormAction}>
      <input type="hidden" name="provider" value="google" />
      <AuthSubmitButton pendingLabel="Redirecting…">
        {label}
      </AuthSubmitButton>
    </form>
  );
}
