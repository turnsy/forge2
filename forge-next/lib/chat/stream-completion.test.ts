import { describe, expect, it } from "vitest";
import {
  isCompletedChatRun,
  isUserAbortError,
  wasChatRunInterrupted,
} from "@/lib/chat/stream-completion";

describe("stream completion helpers", () => {
  it("treats done and error as completed runs", () => {
    expect(isCompletedChatRun("done")).toBe(true);
    expect(isCompletedChatRun("error")).toBe(true);
    expect(isCompletedChatRun("generating")).toBe(false);
    expect(isCompletedChatRun(null)).toBe(false);
  });

  it("detects interrupted runs from active or missing status", () => {
    expect(wasChatRunInterrupted("generating")).toBe(true);
    expect(wasChatRunInterrupted("sandbox")).toBe(true);
    expect(wasChatRunInterrupted(null)).toBe(true);
    expect(wasChatRunInterrupted("done")).toBe(false);
    expect(wasChatRunInterrupted("error")).toBe(false);
  });

  it("detects user abort failures from Eve optimistic replay", () => {
    expect(isUserAbortError("fetch is aborted")).toBe(true);
    expect(isUserAbortError("The operation was aborted.")).toBe(true);
    expect(isUserAbortError("AI Gateway authentication failed.")).toBe(false);
  });
});
