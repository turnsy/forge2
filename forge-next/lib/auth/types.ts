export type UserRole = "coach" | "athlete";

export type AuthProvider = "google" | "apple";

export type AuthActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export type Profile = {
  id: string;
  role: UserRole | null;
  full_name: string | null;
  invite_code: string | null;
  contact_info: Record<string, unknown>;
  created_at: string;
  deleted_at: string | null;
};

export type AuthUser = {
  id: string;
  email: string | undefined;
  role: UserRole | null;
  fullName: string | null;
};

export const SIGNUP_ROLE_COOKIE = "forge_signup_role";
