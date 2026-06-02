import { describe, expect, it } from "vitest";
import { PlanChatRunStatusEvent } from "@/lib/ai/plan-chat";
import {
  getAiGatewayApiKey,
  isAiGatewayConfigured,
} from "@/lib/env/plan-generation";
import { runPlanSandbox } from "@/lib/sandbox";
import {
  DRAFT_UPLOADS_BUCKET,
  draftUploadObjectPath,
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
    expect(DRAFT_UPLOADS_BUCKET).toBe("draft-uploads");
    expect(draftUploadObjectPath("coach-1", "draft-1", "file.csv")).toBe(
      "coach-1/draft-1/file.csv.txt",
    );
  });

  it("loads scaffold modules", () => {
    const event: PlanChatRunStatusEvent = {
      type: "runStatus",
      status: "parsing",
    };
    expect(event.status).toBe("parsing");
    expect(typeof runPlanSandbox).toBe("function");
  });
});
