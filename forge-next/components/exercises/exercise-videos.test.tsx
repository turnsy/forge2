import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { expect, it, vi } from "vitest";
import {
  ExerciseVideos,
  notifyExerciseVideoChanged,
  useExerciseVideo,
} from "./exercise-videos";
import {
  minimalWorkoutPlan,
  makeExercise,
} from "@/lib/plans/__tests__/fixtures";

function Video({ id }: { id: string }) {
  return <span data-testid={id}>{useExerciseVideo(id) ?? "none"}</span>;
}
it("deduplicates IDs across a plan and reloads the shared link after editing", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const plan = structuredClone(minimalWorkoutPlan);
  plan.weeks[0].days[0].blocks[0].exercises = [
    makeExercise({ name: "Squat", resolvedExerciseId: id }),
    makeExercise({ name: "Squat", resolvedExerciseId: id }),
  ];
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ videos: { [id]: "https://youtu.be/first" } }),
    )
    .mockResolvedValueOnce(
      Response.json({ videos: { [id]: "https://youtu.be/second" } }),
    );
  vi.stubGlobal("fetch", fetch);
  render(
    <ExerciseVideos plan={plan}>
      <Video id={id} />
    </ExerciseVideos>,
  );
  await waitFor(() =>
    expect(screen.getByTestId(id)).toHaveTextContent("https://youtu.be/first"),
  );
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetch.mock.calls[0][1].body).ids).toEqual([id]);
  act(() => notifyExerciseVideoChanged(id, "https://youtu.be/second"));
  await waitFor(() =>
    expect(screen.getByTestId(id)).toHaveTextContent("https://youtu.be/second"),
  );
});
it("shows load failures and allows retry", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const plan = structuredClone(minimalWorkoutPlan);
  plan.weeks[0].days[0].blocks[0].exercises[0].resolvedExerciseId = id;
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 500 }))
      .mockResolvedValueOnce(
        Response.json({ videos: { [id]: "https://youtu.be/retry" } }),
      ),
  );
  render(
    <ExerciseVideos plan={plan}>
      <Video id={id} />
    </ExerciseVideos>,
  );
  expect(
    await screen.findByText(/Could not load exercise videos/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByText("Retry"));
  await waitFor(() =>
    expect(screen.getByTestId(id)).toHaveTextContent("https://youtu.be/retry"),
  );
});
