import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChatWorkspace } from "@/lib/chat/use-chat-workspace";
import type { ChatEvent } from "@/lib/chat/types";

describe("useChatWorkspace", () => {
  it("sends a message and applies streamed events", async () => {
    const streamChat = vi.fn(
      async ({
        onEvent,
      }: {
        onEvent: (event: ChatEvent<string>) => void;
      }) => {
        onEvent({ type: "assistantTextDelta", delta: "Done." });
        onEvent({ type: "runStatus", status: "done" });
        return null;
      },
    );

    const { result } = renderHook(() =>
      useChatWorkspace({
        streamChat,
        uploadFile: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.sendMessage([
        { type: "text", value: "Build something" },
      ]);
    });

    await waitFor(() => {
      expect(result.current.state.messages).toEqual([
        { role: "user", content: "Build something" },
        { role: "assistant", content: "Done." },
      ]);
    });
    expect(streamChat).toHaveBeenCalledOnce();
  });

  it("restarts with a fresh draft id and cleared state", () => {
    const { result } = renderHook(() =>
      useChatWorkspace({
        streamChat: vi.fn(),
        uploadFile: vi.fn(),
      }),
    );

    const priorDraftId = result.current.state.draftId;

    act(() => {
      result.current.restart();
    });

    expect(result.current.state.draftId).not.toBe(priorDraftId);
    expect(result.current.state.hasStarted).toBe(false);
    expect(result.current.state.messages).toHaveLength(0);
  });
});
