import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  formDataToRecord,
  parseFormData,
  toFormData,
} from "@/lib/forms/parse";

const testSchema = z.object({
  email: z.string().email(),
  role: z.enum(["coach", "athlete"]),
});

describe("formDataToRecord", () => {
  it("converts FormData entries to a string record", () => {
    const formData = new FormData();
    formData.set("email", "coach@example.com");
    formData.set("role", "coach");

    expect(formDataToRecord(formData)).toEqual({
      email: "coach@example.com",
      role: "coach",
    });
  });
});

describe("toFormData", () => {
  it("serializes values into FormData", () => {
    const formData = toFormData({
      email: "coach@example.com",
      password: "secret",
      role: "coach",
      skipped: undefined,
    });

    expect(formData.get("email")).toBe("coach@example.com");
    expect(formData.get("password")).toBe("secret");
    expect(formData.get("role")).toBe("coach");
    expect(formData.get("skipped")).toBeNull();
  });
});

describe("parseFormData", () => {
  it("returns parsed data for valid FormData", () => {
    const formData = toFormData({
      email: "coach@example.com",
      role: "coach",
    });

    expect(parseFormData(testSchema, formData)).toEqual({
      success: true,
      data: { email: "coach@example.com", role: "coach" },
    });
  });

  it("returns failure for invalid FormData", () => {
    const formData = toFormData({
      email: "not-an-email",
      role: "coach",
    });

    expect(parseFormData(testSchema, formData)).toEqual({ success: false });
  });
});
