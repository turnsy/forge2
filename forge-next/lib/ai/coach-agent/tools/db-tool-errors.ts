import type { ServiceError } from "@/lib/errors/service-error";

export function toToolError(error: ServiceError) {
  return {
    ok: false as const,
    code: error.code,
    message: error.message,
  };
}

export function toToolNotFound(resource: string) {
  return {
    ok: false as const,
    code: "not_found" as const,
    message: `${resource} not found.`,
  };
}
