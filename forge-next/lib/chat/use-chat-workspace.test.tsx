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

  it("calls onSaveSnapshot with finalized state after streaming", async () => {
    const onSaveSnapshot = vi.fn();
    const streamChat = vi.fn(
      async ({
        onEvent,
      }: {
        onEvent: (event: ChatEvent<string>) => void;
      }) => {
        onEvent({ type: "assistantTextDelta", delta: "Saved." });
        return null;
      },
    );

    const { result } = renderHook(() =>
      useChatWorkspace(
        {
          streamChat,
          uploadFile: vi.fn(),
          onSaveSnapshot,
        },
      ),
    );

    await act(async () => {
      await result.current.sendMessage([{ type: "text", value: "Hello" }]);
    });

    expect(onSaveSnapshot).toHaveBeenCalledOnce();
    expect(onSaveSnapshot.mock.calls[0][0].messages).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Saved." },
    ]);
  });

  it("updates currentArtifact when setArtifact is called", () => {
    const { result } = renderHook(() =>
      useChatWorkspace({
        streamChat: vi.fn(),
        uploadFile: vi.fn(),
      }),
    );

    act(() => {
      result.current.setArtifact("updated-artifact");
    });

    expect(result.current.state.currentArtifact).toBe("updated-artifact");
  });

  it("restarts with a fresh draft id and cleared state", () => {
    const { result } = renderHook(() =>
      useChatWorkspace({
        streamChat: vi.fn(),
        uploadFile: vi.fn(),
      }),
    );

    const priorSessionId = result.current.state.sessionId;

    act(() => {
      result.current.restart();
    });

    expect(result.current.state.sessionId).not.toBe(priorSessionId);
    expect(result.current.state.hasStarted).toBe(false);
    expect(result.current.state.messages).toHaveLength(0);
  });
});
