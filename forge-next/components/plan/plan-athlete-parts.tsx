import { VideoIcon } from "@/components/icons/video-icon";
import { IconButton, Input } from "@/components/ui";
import { isSetActualComplete } from "@/lib/athlete/plan/domain";
import { getSetNotes } from "@/lib/plans/display";
import type { AbsoluteLoad, PercentageLoad, Set } from "@/lib/plans/workout-plan";
import {
  accordionClass,
  accordionNestedClass,
  completionCheckmarkClass,
} from "@/lib/theme";

export type AthleteSetFormState = {
  reps: string;
  target: string;
};

function getTargetUnitLabel(set: Set): string | null {
  if (set.planned.type !== "exact") {
    return null;
  }

  return set.planned.target.unit;
}

function getPercentagePlaceholder(set: Set): string {
  if (set.planned.type !== "exact" || set.planned.target.type !== "percentage") {
    return "";
  }

  const load = set.planned.target as PercentageLoad;
  return `${load.value}%`;
}

function getAbsoluteLoadPlaceholder(set: Set): string {
  if (set.planned.type !== "exact" || set.planned.target.type !== "absolute") {
    return "";
  }

  return String((set.planned.target as AbsoluteLoad).value);
}

export function athleteSetCardClassName(complete: boolean): string {
  return [accordionClass(complete ? "success" : "default"), "space-y-2 !p-3"].join(" ");
}

export function athleteReadOnlySetCardClassName(set: Set): string {
  if (set.status === "skipped") {
    return [
      accordionClass("default"),
      "space-y-2 !p-3",
      "border-orange-500/35 bg-orange-500/10",
    ].join(" ");
  }

  return athleteSetCardClassName(set.status === "completed" || isSetActualComplete(set));
}

export function athleteSupersetRoundCardClassName(): string {
  return [accordionNestedClass("default"), "space-y-3 !p-3"].join(" ");
}

export function athleteSupersetBlockClassName(): string {
  return "space-y-4 rounded-lg border border-glass-border/80 bg-glass/30 p-4";
}

function SetCheckmark({ complete }: { complete: boolean }) {
  return (
    <span aria-hidden="true" className={completionCheckmarkClass(complete)}>
      ✓
    </span>
  );
}

function SetRowInputs({
  set,
  reps,
  target,
  onRepsChange,
  onTargetChange,
  readOnly = false,
}: {
  set: Set;
  reps: string;
  target: string;
  onRepsChange?: (value: string) => void;
  onTargetChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  if (set.planned.type === "target") {
    return (
      <p className="min-w-0 flex-1 text-sm text-surface-muted">
        {set.planned.instruction}
      </p>
    );
  }

  const unit = getTargetUnitLabel(set);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Input
        aria-label="Set reps"
        type="text"
        value={reps}
        placeholder={String(set.planned.reps)}
        readOnly={readOnly}
        onChange={
          readOnly ? undefined : (event) => onRepsChange?.(event.target.value)
        }
        className="w-16"
        size="sm"
      />
      <span className="shrink-0 text-sm text-surface-muted">of</span>
      <Input
        aria-label="Set target"
        type="text"
        value={target}
        placeholder={
          set.planned.target.type === "percentage"
            ? getPercentagePlaceholder(set)
            : getAbsoluteLoadPlaceholder(set)
        }
        readOnly={readOnly}
        onChange={
          readOnly ? undefined : (event) => onTargetChange?.(event.target.value)
        }
        className="w-16"
        size="sm"
      />
      {unit ? <span className="shrink-0 text-sm text-surface-muted">{unit}</span> : null}
    </div>
  );
}

export function AthleteExerciseNotes({ notes }: { notes?: string }) {
  if (!notes?.trim()) {
    return null;
  }

  return <p className="text-sm text-surface-muted">{notes.trim()}</p>;
}

export function AthleteExerciseHeader({
  name,
  videoUrl,
}: {
  name: string;
  videoUrl?: string;
}) {
  if (!videoUrl) {
    return (
      <h2 className="text-base font-semibold text-surface-foreground">{name}</h2>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-surface-foreground">{name}</h2>
      <IconButton
        variant="ghost"
        size="sm"
        icon={<VideoIcon className="h-4 w-4" />}
        aria-label="Watch exercise video"
        onClick={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
      />
    </div>
  );
}

function AthleteSetNotes({ notes }: { notes?: string }) {
  if (!notes) {
    return null;
  }

  return <p className="text-sm text-surface-muted">{notes}</p>;
}

export function AthleteSetRow({
  set,
  setIdx,
  reps,
  target,
  readOnly,
  complete,
  setRef,
  onRepsChange,
  onTargetChange,
}: {
  set: Set;
  setIdx: number;
  reps: string;
  target: string;
  readOnly?: boolean;
  complete?: boolean;
  setRef?: (node: HTMLDivElement | null) => void;
  onRepsChange?: (value: string) => void;
  onTargetChange?: (value: string) => void;
}) {
  const notes = getSetNotes(set);

  return (
    <div
      ref={setRef}
      className={
        readOnly
          ? athleteReadOnlySetCardClassName(set)
          : athleteSetCardClassName(Boolean(complete))
      }
      data-set-status={readOnly ? set.status : undefined}
      data-set-complete={complete ? "true" : "false"}
    >
      <AthleteSetNotes notes={notes} />
      <div className="flex items-center gap-3">
        <span className="w-6 shrink-0 text-center text-sm font-medium text-surface-muted">
          {setIdx + 1}
        </span>
        <SetRowInputs
          set={set}
          reps={reps}
          target={target}
          readOnly={readOnly}
          onRepsChange={onRepsChange}
          onTargetChange={onTargetChange}
        />
        <SetCheckmark complete={Boolean(complete)} />
      </div>
    </div>
  );
}
