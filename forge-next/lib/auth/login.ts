import type { UserRole } from "@/lib/auth/types";

export const LOGIN_HUB_PATH = "/auth/login";

export function loginPathForRole(role: UserRole): string {
  return `/auth/login/${role}`;
}

export function loginHubPath(): string {
  return LOGIN_HUB_PATH;
}
