import { Button } from "@/components/ui";

export function SignOutButton() {
  return (
    <form action="/auth/logout" method="post">
      <Button type="submit" variant="ghost" fullWidth={false}>
        Log out
      </Button>
    </form>
  );
}
