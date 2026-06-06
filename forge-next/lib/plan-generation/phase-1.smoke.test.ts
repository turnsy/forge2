import { describe, expect, it } from "vitest";
import type { PlanChatRunStatusEvent } from "@/lib/ai/plan-chat";
import {
  getAiGatewayApiKey,
  isAiGatewayConfigured,
} from "@/lib/env/plan-generation";
import { runSandbox } from "@/lib/sandbox";
import {
  SESSION_UPLOADS_BUCKET,
  sessionUploadObjectPath,
} from "@/lib/uploads/storage-paths";
import { UPLOAD_MAX_FILES_PER_MESSAGE } from "@/lib/uploads/limits";

describe("phase 1 foundation smoke", () => {
  it("loads upload limits", () => {
    expect(UPLOAD_MAX_FILES_PER_MESSAGE).toBeGreaterThan(0);
  });

  it("loads env helpers without throwing", () => {
    expect(typeof getAiGatewayApiKey()).toBe("undefined");
    expect(isAiGatewayConfigured()).toBe(false);
  });

  it("loads storage path helpers", () => {
    expect(SESSION_UPLOADS_BUCKET).toBe("session-uploads");
    expect(sessionUploadObjectPath("coach-1", "session-1", "file.csv")).toBe(
      "coach-1/session-1/file.csv.txt",
    );
  });

  it("loads scaffold modules", () => {
    const event: PlanChatRunStatusEvent = {
      type: "runStatus",
      status: "parsing",
    };
    expect(event.status).toBe("parsing");
    expect(typeof runSandbox).toBe("function");
  });
});
