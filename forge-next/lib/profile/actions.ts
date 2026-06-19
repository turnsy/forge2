"use server";

import { revalidatePath } from "next/cache";
import { requireRoleAuth } from "@/lib/errors/require-role-auth";
import {
  ServiceErrorCode,
  serviceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import {
  updateProfileEmail,
  updateProfileFullName,
} from "@/lib/profile/repository";

export type UpdateProfileFullNameActionResult = ServiceResult<Record<never, never>>;
export type UpdateProfileEmailActionResult = ServiceResult<Record<never, never>>;

export async function updateProfileFullNameAction(
  fullName: string,
): Promise<UpdateProfileFullNameActionResult> {
  const auth = await requireRoleAuth("athlete");
  if (!auth.ok) {
    return auth;
  }

  const result = await updateProfileFullName(auth.user.id, fullName);
  if (!result.ok) {
    return result;
  }

  revalidatePath("/athlete/settings");
  revalidatePath("/athlete", "layout");

  return { ok: true };
}

export async function updateProfileEmailAction(
  email: string,
): Promise<UpdateProfileEmailActionResult> {
  const auth = await requireRoleAuth("athlete");
  if (!auth.ok) {
    return auth;
  }

  const trimmed = email.trim();
  if (auth.user.email && trimmed.toLowerCase() === auth.user.email.toLowerCase()) {
    return serviceError(
      ServiceErrorCode.VALIDATION_ERROR,
      "Enter a different email address",
    );
  }

  const result = await updateProfileEmail(trimmed);
  if (!result.ok) {
    return result;
  }

  return { ok: true };
}
