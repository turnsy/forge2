"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Button, Message } from "@/components/ui";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

type Videos = Record<string, string | null>;
const VideoContext = createContext<Videos>({});
export const VIDEO_CHANGED_EVENT = "forge-exercise-video-changed";
export function notifyExerciseVideoChanged(id: string, url: string | null) {
  window.dispatchEvent(
    new CustomEvent(VIDEO_CHANGED_EVENT, { detail: { id, url } }),
  );
}
export function useExerciseVideo(id?: string) {
  return useContext(VideoContext)[id ?? ""] ?? undefined;
}

export function ExerciseVideos({
  plan,
  children,
}: {
  plan: WorkoutPlan | null;
  children: ReactNode;
}) {
  const idsKey = JSON.stringify(
    [
      ...new Set(
        plan?.weeks.flatMap((w) =>
          w.days.flatMap((d) =>
            d.blocks.flatMap((b) =>
              b.exercises.flatMap((e) =>
                e.resolvedExerciseId ? [e.resolvedExerciseId] : [],
              ),
            ),
          ),
        ) ?? [],
      ),
    ].sort(),
  );
  const [videos, setVideos] = useState<Videos>({});
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const ids: string[] = JSON.parse(idsKey);
    async function load() {
      try {
        const batches: Videos[] = [];
        for (let i = 0; i < ids.length; i += 200) {
          const response = await fetch("/api/exercises/videos", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ids: ids.slice(i, i + 200) }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error("Could not load videos");
          batches.push((await response.json()).videos);
        }
        if (!controller.signal.aborted) {
          setVideos(Object.assign({}, ...batches));
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void load();
    // Reload after an edit so an older in-flight batch cannot overwrite the saved URL.
    const changed = (event: Event) => {
      const { id, url } = (
        event as CustomEvent<{ id: string; url: string | null }>
      ).detail;
      setVideos((previous) => ({ ...previous, [id]: url }));
      controller.abort();
      setRevision((n) => n + 1);
    };
    window.addEventListener(VIDEO_CHANGED_EVENT, changed);
    return () => {
      controller.abort();
      window.removeEventListener(VIDEO_CHANGED_EVENT, changed);
    };
  }, [idsKey, revision]);

  return (
    <VideoContext.Provider value={videos}>
      {error ? (
        <Message tone="error">
          Could not load exercise videos.{" "}
          <Button
            size="sm"
            fullWidth={false}
            variant="secondary"
            onClick={() => setRevision((n) => n + 1)}
          >
            Retry
          </Button>
        </Message>
      ) : null}
      {children}
    </VideoContext.Provider>
  );
}
