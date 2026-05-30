import type { UserRole } from "@/lib/auth/types";

const ROLE_HOME: Record<UserRole, string> = {
  coach: "/coach",
  athlete: "/athlete",
};

export function isUserRole(value: string | null | undefined): value is UserRole {
  return value === "coach" || value === "athlete";
}

export function validateRedirectPath(
  path: string | null | undefined,
  fallback = "/",
): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }

  return path;
}

export function getPostAuthRedirect(role: UserRole | null): string {
  if (role) {
    return ROLE_HOME[role];
  }

  return "/signup";
}

export function getRoleMismatchRedirect(
  requiredRole: UserRole,
  userRole: UserRole | null,
): string {
  if (!userRole) {
    return "/signup";
  }

  return requiredRole === "coach" ? "/athlete" : "/coach";
}

export function getAuthCallbackUrl(origin: string, next?: string): string {
  const params = new URLSearchParams();
  if (next) {
    params.set("next", next);
  }

  const query = params.toString();
  return `${origin}/auth/callback${query ? `?${query}` : ""}`;
}

export function getOAuthRedirectTo(origin: string, next?: string): string {
  return getAuthCallbackUrl(origin, next);
}
