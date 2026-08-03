"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, Message } from "@/components/ui";
import { formatDate } from "@/lib/format/date";

type MaxRow = {
  id: string;
  exercise_id: string;
  exercise_name?: string;
  value: number;
  unit: string;
  source: string;
  logged_at: string;
};

type MaxesEditorProps = {
  listUrl: string;
  saveUrl: string;
  title?: string;
  description?: string;
};

export function MaxesEditor({
  listUrl,
  saveUrl,
  title,
  description,
}: MaxesEditorProps) {
  const [maxes, setMaxes] = useState<MaxRow[]>([]);
  const [exerciseId, setExerciseId] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(listUrl)
      .then((response) => response.json())
      .then((result) => setMaxes(result.maxes ?? []))
      .catch(() => setError("Could not load maxes."));
  }, [listUrl]);

  async function save() {
    setError(null);
    const response = await fetch(saveUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        exerciseId,
        value: Number(value),
        unit,
      }),
    });
    if (!response.ok) {
      setError("Could not save max.");
      return;
    }
    const result = (await response.json()) as { max: MaxRow };
    setMaxes((current) => [result.max, ...current]);
    setExerciseId("");
    setValue("");
  }

  return (
    <Card className="space-y-4">
      {title ? <h1 className="text-lg font-semibold text-surface-foreground">{title}</h1> : null}
      {description ? <p className="text-sm text-surface-muted">{description}</p> : null}
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto]">
          <Input
            aria-label="Exercise"
            placeholder="Exercise id"
            value={exerciseId}
            onChange={(event) => setExerciseId(event.target.value.trim())}
          />
          <Input
            aria-label="Max value"
            type="number"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <Input aria-label="Unit" value={unit} onChange={(event) => setUnit(event.target.value)} />
          <Button type="button" onClick={() => void save()} disabled={!exerciseId || !value}>
            Add
          </Button>
        </div>
        {error ? <Message tone="error">{error}</Message> : null}
        <div className="overflow-x-auto rounded-xl border border-glass-border">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-glass-border text-left text-xs font-medium uppercase tracking-wide text-surface-muted">
                <th className="px-4 py-3 font-medium">Exercise</th>
                <th className="px-4 py-3 font-medium">Max</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {maxes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-surface-muted">
                    No maxes recorded yet.
                  </td>
                </tr>
              ) : (
                maxes.map((max) => (
                  <tr key={max.id} className="border-b border-glass-border/60 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-surface-foreground">
                      {max.exercise_name ?? max.exercise_id}
                    </td>
                    <td className="px-4 py-3 text-surface-foreground">
                      {max.value} {max.unit}
                    </td>
                    <td className="px-4 py-3 text-surface-muted">{formatDate(max.logged_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
