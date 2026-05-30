import { redirect } from "next/navigation";
import { loginHubPath } from "@/lib/auth/login";

export default function LoginRedirectPage() {
  redirect(loginHubPath());
}
