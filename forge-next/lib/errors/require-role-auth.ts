import { getAuthUser } from "@/lib/auth/session";
import type { AuthUser, UserRole } from "@/lib/auth/types";
import {
  ServiceErrorCode,
  serviceError,
  type ServiceResult,
} from "@/lib/errors/service-error";

export type RoleAuthResult = ServiceResult<{ user: AuthUser }>;

export async function requireRoleAuth(role: UserRole): Promise<RoleAuthResult> {
  const user = await getAuthUser();

  if (!user) {
    return serviceError(ServiceErrorCode.UNAUTHORIZED, "Not authenticated");
  }

  if (user.role !== role) {
    return serviceError(ServiceErrorCode.UNAUTHORIZED, "Access denied");
  }

  return { ok: true, user };
}
