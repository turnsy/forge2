import {
  ServiceErrorCode,
  serviceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import { createClient } from "@/utils/supabase/server";

type ProfileClient = Awaited<ReturnType<typeof createClient>>;

export type UpdateProfileFullNameResult = ServiceResult<Record<never, never>>;
export type UpdateProfileEmailResult = ServiceResult<Record<never, never>>;

async function resolveClient(client?: ProfileClient): Promise<ProfileClient> {
  return client ?? (await createClient());
}

export async function updateProfileFullName(
  userId: string,
  fullName: string,
  client?: ProfileClient,
): Promise<UpdateProfileFullNameResult> {
  const trimmed = fullName.trim();

  if (!trimmed) {
    return serviceError(ServiceErrorCode.VALIDATION_ERROR, "Name is required");
  }

  const supabase = await resolveClient(client);
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmed })
    .eq("id", userId);

  if (error) {
    return serviceError(ServiceErrorCode.DB_ERROR, error.message);
  }

  return { ok: true };
}

export async function updateProfileEmail(
  email: string,
  client?: ProfileClient,
): Promise<UpdateProfileEmailResult> {
  const trimmed = email.trim();

  if (!trimmed) {
    return serviceError(ServiceErrorCode.VALIDATION_ERROR, "Email is required");
  }

  const supabase = await resolveClient(client);
  const { error } = await supabase.auth.updateUser({ email: trimmed });

  if (error) {
    return serviceError(ServiceErrorCode.DB_ERROR, error.message);
  }

  return { ok: true };
}
