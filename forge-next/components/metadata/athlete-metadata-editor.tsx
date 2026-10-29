"use client";
import { useCallback, useEffect, useState } from "react";
import { Button, Message } from "@/components/ui";
import { MetadataInputs } from "./metadata-inputs";
import {
  formatValue,
  validateValue,
  type Field,
  type Definition,
  type Snapshot,
  type Value,
} from "@/lib/metadata/domain";
import { metadataRequest } from "@/lib/metadata/client";
type HistoryEvent = {
  id: number;
  field_id: string;
  value: Value;
  definition?: Definition;
  actor_id: string;
  created_at: string;
  actor?: { full_name: string | null; role: string } | null;
};
export function AthleteMetadataEditor({
  athleteId,
  title = "Athlete profile",
  onSaved,
}: {
  athleteId?: string;
  title?: string;
  onSaved?: () => void;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [values, setValues] = useState<Record<string, Value>>({});
  const [dirty, setDirty] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryEvent[] | null>(null);
  const [historyFields, setHistoryFields] = useState<Field[]>([]);
  const [moreHistory, setMoreHistory] = useState(false);
  const url = `/api/metadata${athleteId ? `?athleteId=${encodeURIComponent(athleteId)}` : ""}`;
  const apply = useCallback((data: Snapshot) => {
    setSnapshot(data);
    setValues(
      Object.fromEntries(data.values.map((v) => [v.field_id, v.value])),
    );
    setDirty([]);
    setHistory(null);
  }, []);
  const load = useCallback(async () => {
    setError("");
    try {
      apply(await metadataRequest<Snapshot>(url));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [url, apply]);
  useEffect(() => {
    let active = true;
    metadataRequest<Snapshot>(url)
      .then((data) => {
        if (active) apply(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [url, apply]);
  async function save() {
    if (!snapshot) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const answers = snapshot.fields
        .filter((f) => dirty.includes(f.id))
        .map((f) => ({
          fieldId: f.id,
          version: f.version,
          value: validateValue(f, values[f.id] ?? null),
        }));
      apply(
        await metadataRequest<Snapshot>("/api/metadata", {
          op: "values",
          athleteId,
          answers,
        }),
      );
      setNotice("Profile saved.");
      onSaved?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function showHistory(more = false) {
    setError("");
    setBusy(true);
    try {
      const data = await metadataRequest<{
        events: HistoryEvent[];
        fields: Field[];
      }>(
        `${url}${url.includes("?") ? "&" : "?"}history=true${more && history?.length ? `&before=${history[history.length - 1].id}` : ""}`,
      );
      setHistory(more ? [...(history ?? []), ...data.events] : data.events);
      setHistoryFields(data.fields);
      setMoreHistory(data.events.length === 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-lg border border-glass-border p-4">
      <h2 className="font-semibold">{title}</h2>
      {error ? (
        <>
          <Message tone="error">{error}</Message>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void load()}
          >
            Reload profile
          </Button>
        </>
      ) : null}
      {!snapshot && !error ? <p role="status">Loading profile…</p> : null}
      {snapshot ? (
        <>
          <p className="text-sm text-surface-muted">
            {snapshot.missing.length
              ? `${snapshot.missing.length} required fields missing. You can complete them later.`
              : "Profile is complete."}
          </p>
          {!snapshot.fields.length ? (
            <p className="text-sm text-surface-muted">
              No custom profile fields have been defined.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <MetadataInputs
                fields={snapshot.fields}
                values={values}
                disabled={busy}
                onChange={(id, value) => {
                  setValues((v) => ({ ...v, [id]: value }));
                  setDirty((d) => (d.includes(id) ? d : [...d, id]));
                  setNotice("");
                }}
              />
              <Button type="submit" disabled={busy || !dirty.length}>
                {busy ? "Saving…" : "Save profile"}
              </Button>
            </form>
          )}
          {notice ? <p role="status">{notice}</p> : null}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => (history ? setHistory(null) : void showHistory())}
          >
            {history ? "Hide history" : "View change history"}
          </Button>
          {history ? (
            <div className="space-y-2">
              {history.length ? (
                history.map((event) => {
                  const f = historyFields.find((f) => f.id === event.field_id);
                  return (
                    <p key={event.id} className="text-sm">
                      {f?.label ?? "Archived field"}:{" "}
                      {f
                        ? formatValue(event.definition ?? f, event.value)
                        : String(event.value)}{" "}
                      · {new Date(event.created_at).toLocaleString()} ·{" "}
                      {event.actor?.full_name ||
                        (event.actor?.role === "athlete" ? "Athlete" : "Coach")}
                    </p>
                  );
                })
              ) : (
                <p>No changes recorded.</p>
              )}
              {moreHistory ? (
                <Button
                  disabled={busy}
                  variant="secondary"
                  onClick={() => void showHistory(true)}
                >
                  More history
                </Button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
