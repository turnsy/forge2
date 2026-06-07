export const ServiceErrorCode = {
  UNAUTHORIZED: "unauthorized",
  NOT_FOUND: "not_found",
  DB_ERROR: "db_error",
  VALIDATION_ERROR: "validation_error",
} as const;

export type ServiceErrorCode =
  (typeof ServiceErrorCode)[keyof typeof ServiceErrorCode];

export type ServiceError = {
  ok: false;
  code: ServiceErrorCode;
  message: string;
};

export type ServiceResult<T> = ({ ok: true } & T) | ServiceError;

export function serviceError(
  code: ServiceErrorCode,
  message: string,
): ServiceError {
  return { ok: false, code, message };
}

export function toHttpStatus(code: ServiceErrorCode): number {
  switch (code) {
    case ServiceErrorCode.UNAUTHORIZED:
      return 401;
    case ServiceErrorCode.NOT_FOUND:
      return 404;
    case ServiceErrorCode.VALIDATION_ERROR:
      return 422;
    default:
      return 500;
  }
}

export function mapRpcErrorMessage(message: string): ServiceError {
  const lower = message.toLowerCase();

  if (lower.includes("not authenticated")) {
    return serviceError(ServiceErrorCode.UNAUTHORIZED, message);
  }

  if (lower.includes("plan not found")) {
    return serviceError(ServiceErrorCode.NOT_FOUND, message);
  }

  if (lower.includes("athlete not linked")) {
    return serviceError(ServiceErrorCode.VALIDATION_ERROR, message);
  }

  if (lower.includes("no athletes provided")) {
    return serviceError(ServiceErrorCode.VALIDATION_ERROR, message);
  }

  return serviceError(ServiceErrorCode.DB_ERROR, message);
}
