export function toToolNotFound(entity: string) {
  return {
    ok: false as const,
    code: "NOT_FOUND" as const,
    message: `${entity} not found.`,
  };
}

export function toToolError(result: { code: string; message: string }) {
  return {
    ok: false as const,
    code: result.code,
    message: result.message,
  };
}
