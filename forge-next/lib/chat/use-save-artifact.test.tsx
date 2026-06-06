import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSaveArtifact } from "@/lib/chat/use-save-artifact";

describe("useSaveArtifact", () => {
  it("tracks saving and saved states", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, value: { id: "1" } });
    const { result } = renderHook(() =>
      useSaveArtifact({
        save,
        successStatus: "saved",
      }),
    );

    await act(async () => {
      await result.current.save({ title: "Artifact" });
    });

    expect(result.current.saveStatus).toBe("saved");
  });

  it("keeps saving state when configured", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, value: { id: "1" } });
    const { result } = renderHook(() =>
      useSaveArtifact({
        save,
        successStatus: "saving",
      }),
    );

    await act(async () => {
      await result.current.save({ title: "Artifact" });
    });

    expect(result.current.saveStatus).toBe("saving");
  });

  it("resets after an error", async () => {
    const save = vi.fn().mockResolvedValue({
      ok: false,
      message: "Failed to save",
    });
    const { result } = renderHook(() => useSaveArtifact({ save }));

    await act(async () => {
      await result.current.save({ title: "Artifact" });
    });

    await waitFor(() => {
      expect(result.current.saveStatus).toBe("idle");
      expect(result.current.saveError).toBe("Failed to save");
    });
  });
});
