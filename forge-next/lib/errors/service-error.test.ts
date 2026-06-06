import { describe, expect, it } from "vitest";
import {
  ServiceErrorCode,
  mapRpcErrorMessage,
  toHttpStatus,
} from "@/lib/errors/service-error";

describe("service-error", () => {
  it("maps rpc messages to service error codes", () => {
    expect(mapRpcErrorMessage("Not authenticated")).toMatchObject({
      code: ServiceErrorCode.UNAUTHORIZED,
    });
    expect(mapRpcErrorMessage("Plan not found")).toMatchObject({
      code: ServiceErrorCode.NOT_FOUND,
    });
    expect(mapRpcErrorMessage("Something else")).toMatchObject({
      code: ServiceErrorCode.DB_ERROR,
    });
  });

  it("maps service error codes to http statuses", () => {
    expect(toHttpStatus(ServiceErrorCode.UNAUTHORIZED)).toBe(401);
    expect(toHttpStatus(ServiceErrorCode.NOT_FOUND)).toBe(404);
    expect(toHttpStatus(ServiceErrorCode.VALIDATION_ERROR)).toBe(422);
    expect(toHttpStatus(ServiceErrorCode.DB_ERROR)).toBe(500);
  });
});
