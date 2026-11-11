"use client";
import { useEffect, useState } from "react";
import { Button, Input, Select, Message } from "@/components/ui";
import {
  validateDefinition,
  type Definition,
  type Field,
} from "@/lib/metadata/domain";
import { metadataRequest } from "@/lib/metadata/client";
const empty: Definition = {
  label: "",
  type: "text",
  required: false,
  options: [],
  position: 0,
  archived: false,
};
export function MetadataFieldEditor() {
  const [fields, setFields] = useState<Field[]>([]);
  const [draft, setDraft] = useState<Definition | null>(null);
  const [editing, setEditing] = useState<Field | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  async function load() {
    try {
      const data = await metadataRequest<{ fields: Field[] }>("/api/metadata");
      setFields(data.fields);
      setLoaded(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    let active = true;
    metadataRequest<{ fields: Field[] }>("/api/metadata")
      .then((data) => {
        if (active) {
          setFields(data.fields);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  function patch(update: Partial<Definition>) {
    setDraft((d) => (d ? { ...d, ...update } : d));
  }
  async function save(definition: Definition, field: Field | null) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await metadataRequest<{ missingAthleteCount: number }>(
        "/api/metadata",
        {
          op: "field",
          definition: validateDefinition(definition),
          id: field?.id,
          version: field?.version,
        },
      );
      setDraft(null);
      setEditing(null);
      setNotice(
        `Field saved. ${result.missingAthleteCount} athletes are now missing this field.`,
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Athlete profile fields</h2>
        <p className="text-sm text-surface-muted">
          Define the questions for your athletes. Both you and the athlete can
          update answers. Required fields never interrupt linking or plans.
        </p>
      </div>
      {error ? <Message tone="error">{error}</Message> : null}
      {notice ? <p role="status">{notice}</p> : null}
      {!loaded ? (
        <Button variant="secondary" onClick={() => void load()}>
          Load fields
        </Button>
      ) : null}
      {loaded && !fields.length ? <p>No profile fields yet.</p> : null}
      <ul className="space-y-2">
        {fields.map((f) => (
          <li
            key={f.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded border border-glass-border p-3"
          >
            <span>
              {f.label} · {f.type.replaceAll("_", " ")}
              {f.required ? " · Required" : ""}
              {f.archived ? " · Archived" : ""}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                variant="secondary"
                onClick={() => {
                  const { id, coach_id, version, ...definition } = f;
                  void id;
                  void coach_id;
                  void version;
                  setEditing(f);
                  setDraft(structuredClone(definition));
                  setError("");
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                disabled={busy}
                variant="secondary"
                onClick={() => {
                  const { id, coach_id, version, ...definition } = f;
                  void id;
                  void coach_id;
                  void version;
                  void save({ ...definition, archived: !f.archived }, f);
                }}
              >
                {f.archived ? "Restore" : "Archive"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {!draft ? (
        <Button
          disabled={busy}
          onClick={() => {
            setEditing(null);
            setDraft({ ...empty, position: fields.length });
            setNotice("");
          }}
        >
          Add field
        </Button>
      ) : (
        <form
          className="space-y-4 rounded border border-glass-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void save(draft, editing);
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <label className="block">
              Field name
              <Input
                aria-label="Field name"
                required
                maxLength={100}
                value={draft.label}
                onChange={(e) => patch({ label: e.target.value })}
              />
            </label>
            <label className="block">
              Description
              <Input
                aria-label="Field description"
                maxLength={500}
                value={draft.description ?? ""}
                onChange={(e) => patch({ description: e.target.value })}
              />
            </label>
            <Select
              label="Field type"
              value={draft.type}
              onChange={(e) => {
                const {
                  semantic,
                  unit,
                  min,
                  max,
                  precision,
                  maxLength,
                  ...base
                } = draft;
                void semantic;
                void unit;
                void min;
                void max;
                void precision;
                void maxLength;
                setDraft({
                  ...base,
                  type: e.target.value as Definition["type"],
                  options: [],
                });
              }}
            >
              {[
                "text",
                "number",
                "single_select",
                "multi_select",
                "boolean",
                "date",
              ].map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            <label className="flex gap-2">
              <input
                type="checkbox"
                checked={draft.required}
                onChange={(e) => patch({ required: e.target.checked })}
              />
              Required
            </label>
            <label className="block">
              Display order
              <Input
                aria-label="Display order"
                type="number"
                min={0}
                step={1}
                value={draft.position}
                onChange={(e) => patch({ position: Number(e.target.value) })}
              />
            </label>
            {draft.type === "number" ? (
              <>
                <label className="block">
                  Unit (optional; kg/lb and cm/in/m changes convert existing
                  values)
                  <Input
                    aria-label="Unit"
                    maxLength={30}
                    value={draft.unit ?? ""}
                    onChange={(e) => patch({ unit: e.target.value })}
                  />
                </label>
                {(["min", "max", "precision"] as const).map((key) => (
                  <label key={key} className="block">
                    {key === "precision"
                      ? "Decimal places"
                      : key === "min"
                        ? "Minimum"
                        : "Maximum"}
                    <Input
                      aria-label={key}
                      type="number"
                      step={key === "precision" ? 1 : "any"}
                      value={draft[key] ?? ""}
                      onChange={(e) => {
                        const next = { ...draft };
                        if (e.target.value === "") delete next[key];
                        else next[key] = Number(e.target.value);
                        setDraft(next);
                      }}
                    />
                  </label>
                ))}
              </>
            ) : null}
            {draft.type === "text" ? (
              <label className="block">
                Maximum characters
                <Input
                  aria-label="Maximum characters"
                  type="number"
                  min={1}
                  max={10000}
                  value={draft.maxLength ?? 10000}
                  onChange={(e) => patch({ maxLength: Number(e.target.value) })}
                />
              </label>
            ) : null}
            {draft.type === "date" ? (
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={draft.semantic === "birth_date"}
                  onChange={(e) => {
                    const next = { ...draft };
                    if (e.target.checked) next.semantic = "birth_date";
                    else delete next.semantic;
                    setDraft(next);
                  }}
                />
                Use as birth date for age filtering
              </label>
            ) : null}
            {["single_select", "multi_select"].includes(draft.type) ? (
              <div className="space-y-2">
                <p>Options</p>
                {draft.options.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <Input
                      aria-label={`Option ${i + 1}`}
                      required
                      maxLength={100}
                      value={o.label}
                      onChange={(e) =>
                        patch({
                          options: draft.options.map((v, j) =>
                            i === j ? { ...v, label: e.target.value } : v,
                          ),
                        })
                      }
                    />
                    <label className="flex gap-1">
                      <input
                        type="checkbox"
                        checked={!!o.archived}
                        onChange={(e) =>
                          patch({
                            options: draft.options.map((v, j) =>
                              i === j
                                ? { ...v, archived: e.target.checked }
                                : v,
                            ),
                          })
                        }
                      />
                      Retired
                    </label>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  type="button"
                  disabled={draft.options.length >= 100}
                  onClick={() =>
                    patch({
                      options: [
                        ...draft.options,
                        { id: crypto.randomUUID(), label: "" },
                      ],
                    })
                  }
                >
                  Add option
                </Button>
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                Save field
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => setDraft(null)}
              >
                Cancel
              </Button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
