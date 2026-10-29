import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExerciseVideoEditor } from "./exercise-video-editor";

describe("ExerciseVideoEditor", () => {
  it("saves directly to the exercise without a plan save", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(Response.json({ videoUrl: "https://youtu.be/new" }));
    vi.stubGlobal("fetch", fetch);
    const saved = vi.fn();
    render(
      <ExerciseVideoEditor
        exerciseId="squat"
        name="Squat"
        videoUrl="https://youtu.be/old"
        onSaved={saved}
      />,
    );
    fireEvent.click(screen.getByLabelText("Edit exercise video"));
    expect(screen.getByLabelText("Video URL")).toHaveValue(
      "https://youtu.be/old",
    );
    fireEvent.change(screen.getByLabelText("Video URL"), {
      target: { value: "https://youtu.be/new" },
    });
    fireEvent.click(screen.getByText("Save video"));
    await waitFor(() =>
      expect(saved).toHaveBeenCalledWith("https://youtu.be/new"),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/coach/exercises/squat/video",
      expect.objectContaining({
        body: JSON.stringify({ videoUrl: "https://youtu.be/new" }),
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("creates an unresolved exercise before saving its video", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ exercise: { id: "new" } }))
      .mockResolvedValueOnce(Response.json({ videoUrl: null }));
    vi.stubGlobal("fetch", fetch);
    const resolved = vi.fn();
    render(<ExerciseVideoEditor name="New exercise" onResolved={resolved} />);
    fireEvent.click(screen.getByLabelText("Edit exercise video"));
    fireEvent.click(screen.getByText("Save video"));
    await waitFor(() => expect(resolved).toHaveBeenCalledWith("new"));
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "/api/coach/exercises/confirm",
      "/api/coach/exercises/new/video",
    ]);
  });
  it("keeps failures editable and supports retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ error: "Try again" }, { status: 500 }),
        )
        .mockResolvedValueOnce(Response.json({ videoUrl: null })),
    );
    render(<ExerciseVideoEditor exerciseId="squat" name="Squat" />);
    fireEvent.click(screen.getByLabelText("Edit exercise video"));
    fireEvent.click(screen.getByText("Save video"));
    expect(await screen.findByText("Try again")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save video"));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("validates input and cancels without writing", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    render(<ExerciseVideoEditor exerciseId="squat" name="Squat" />);
    fireEvent.click(screen.getByLabelText("Edit exercise video"));
    fireEvent.change(screen.getByLabelText("Video URL"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByText("Save video"));
    expect(
      screen.getByText("Enter a valid http or https video URL."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    expect(fetch).not.toHaveBeenCalled();
  });
  it("removes the saved video directly, ignoring unsaved input changes", async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ videoUrl: null }));
    vi.stubGlobal("fetch", fetch);
    const saved = vi.fn();
    render(
      <ExerciseVideoEditor
        exerciseId="squat"
        name="Squat"
        videoUrl="https://youtu.be/old"
        onSaved={saved}
      />,
    );
    fireEvent.click(screen.getByLabelText("Edit exercise video"));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Video URL"), {
      target: { value: "invalid draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove video" }));
    await waitFor(() => expect(saved).toHaveBeenCalledWith(null));
    expect(fetch).toHaveBeenCalledWith(
      "/api/coach/exercises/squat/video",
      expect.objectContaining({ body: JSON.stringify({ videoUrl: "" }) }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("only offers removal when a saved video exists", () => {
    render(<ExerciseVideoEditor exerciseId="squat" name="Squat" />);
    fireEvent.click(screen.getByLabelText("Edit exercise video"));
    expect(
      screen.queryByRole("button", { name: "Remove video" }),
    ).not.toBeInTheDocument();
  });
  it("keeps a failed removal open for retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ error: "Removal failed" }, { status: 500 }),
        )
        .mockResolvedValueOnce(Response.json({ videoUrl: null })),
    );
    render(
      <ExerciseVideoEditor
        exerciseId="squat"
        name="Squat"
        videoUrl="https://youtu.be/old"
      />,
    );
    fireEvent.click(screen.getByLabelText("Edit exercise video"));
    fireEvent.click(screen.getByRole("button", { name: "Remove video" }));
    expect(await screen.findByText("Removal failed")).toBeInTheDocument();
    expect(screen.getByLabelText("Video URL")).toHaveValue(
      "https://youtu.be/old",
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove video" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
