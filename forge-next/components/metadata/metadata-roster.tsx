"use client";
import { AthleteList } from "@/components/athlete-list";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input, Select, Message } from "@/components/ui";
import { MetadataInputs } from "./metadata-inputs";
import { metadataRequest } from "@/lib/metadata/client";
import type { Field, Value } from "@/lib/metadata/domain";
import type { MetadataFilter } from "@/lib/metadata/filters";
import type { MetadataAthlete } from "@/lib/metadata/repository";
export function MetadataRoster({
  initialQuery = "",
  initialPage = 1,
}: {
  initialQuery?: string;
  initialPage?: number;
}) {
  const [fields, setFields] = useState<Field[]>([]);
  const [items, setItems] = useState<MetadataAthlete[]>([]);
  const [total, setTotal] = useState(0);
  const [incompleteCount, setIncompleteCount] = useState(0);
  const [q, setQ] = useState(initialQuery);
  const [incomplete, setIncomplete] = useState(false);
  const [filters, setFilters] = useState<MetadataFilter[]>([]);
  const [fieldId, setFieldId] = useState("");
  const [op, setOp] = useState<MetadataFilter["op"]>("eq");
  const [value, setValue] = useState<Value>(null);
  const [upper, setUpper] = useState("");
  const [page, setPage] = useState(initialPage);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setBusy(true);
    setError("");
    try {
      const [result, warning] = await Promise.all([
        metadataRequest<{ items: MetadataAthlete[]; total: number }>(
          "/api/metadata",
          { op: "search", filters, q, page, limit: 20, incomplete },
        ),
        metadataRequest<{ total: number }>("/api/metadata", {
          op: "search",
          filters: [],
          incomplete: true,
          limit: 1,
        }),
      ]);
      if (version !== requestVersion.current) return;
      setItems(result.items);
      setTotal(result.total);
      setIncompleteCount(warning.total);
    } catch (e) {
      if (version === requestVersion.current) setError((e as Error).message);
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }, [filters, q, page, incomplete]);
  useEffect(() => {
    let active = true;
    metadataRequest<{ fields: Field[] }>("/api/metadata")
      .then((d) => {
        if (active) setFields(d.fields.filter((f) => !f.archived));
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);
  const field = fields.find((f) => f.id === fieldId);
  const ops = field
    ? [
        "missing",
        "answered",
        ...(field.type === "text"
          ? ["eq", "contains"]
          : field.type === "number"
            ? ["eq", "gte", "lte", "between"]
            : field.type === "date"
              ? [
                  "eq",
                  "gte",
                  "lte",
                  "between",
                  ...(field.semantic ? ["age_between"] : []),
                ]
              : field.type === "multi_select"
                ? ["any", "all"]
                : field.type === "single_select"
                  ? ["eq", "any"]
                  : ["eq"]),
      ]
    : [];
  function add() {
    setFilters((f) => [
      ...f,
      {
        fieldId,
        op,
        ...(!["missing", "answered"].includes(op)
          ? {
              value:
                op === "age_between"
                  ? Number(value)
                  : op === "any" && !Array.isArray(value)
                    ? [String(value)]
                    : (value ?? undefined),
            }
          : {}),
        ...(op === "between" || op === "age_between"
          ? {
              upper:
                field?.type === "number" || op === "age_between"
                  ? Number(upper)
                  : upper,
            }
          : {}),
      },
    ]);
    setPage(1);
  }
  return (
    <section className="space-y-4">
      {incompleteCount > 0 ? (
        <div role="status" className="rounded border border-glass-border p-3">
          {incompleteCount} athletes are missing required profile fields.{" "}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIncomplete(true);
              setPage(1);
            }}
          >
            Show incomplete profiles
          </Button>
        </div>
      ) : null}
      <Input
        aria-label="Search athletes"
        placeholder="Search athletes"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
      />
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={incomplete}
          onChange={(e) => {
            setIncomplete(e.target.checked);
            setPage(1);
          }}
        />
        Missing required fields only
      </label>
      <details className="space-y-3">
        <summary className="cursor-pointer">Filter by athlete profile</summary>
        <Select
          label="Profile field"
          value={fieldId}
          onChange={(e) => {
            setFieldId(e.target.value);
            setOp("missing");
            setValue(null);
            setUpper("");
          }}
        >
          <option value="">Choose a field</option>
          {fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </Select>
        {field ? (
          <>
            <Select
              label="Condition"
              value={op}
              onChange={(e) => {
                setOp(e.target.value as MetadataFilter["op"]);
                setValue(null);
              }}
            >
              {ops.map((o) => (
                <option key={o} value={o}>
                  {o.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
            {!["missing", "answered"].includes(op) ? (
              op === "age_between" ? (
                <Input
                  aria-label="Minimum age"
                  type="number"
                  min={0}
                  value={value === null ? "" : String(value)}
                  onChange={(e) =>
                    setValue(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                />
              ) : (
                <MetadataInputs
                  fields={[
                    {
                      ...field,
                      required: false,
                      ...(op === "any"
                        ? { type: "multi_select" as const }
                        : {}),
                    },
                  ]}
                  values={{ [field.id]: value }}
                  onChange={(_, v) => setValue(v)}
                />
              )
            ) : null}
            {op === "between" || op === "age_between" ? (
              <Input
                aria-label="Upper bound"
                type={
                  op === "age_between" || field.type === "number"
                    ? "number"
                    : "date"
                }
                value={upper}
                onChange={(e) => setUpper(e.target.value)}
              />
            ) : null}
            <Button
              size="sm"
              disabled={
                filters.length >= 30 ||
                (!["missing", "answered"].includes(op) && value === null) ||
                (["between", "age_between"].includes(op) && !upper)
              }
              onClick={add}
            >
              Add filter
            </Button>
          </>
        ) : null}
      </details>
      {filters.length ? (
        <ul>
          {filters.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {fields.find((x) => x.id === f.fieldId)?.label} ·{" "}
              {f.op.replaceAll("_", " ")} ·{" "}
              {Array.isArray(f.value)
                ? f.value
                    .map(
                      (v) =>
                        fields
                          .find((x) => x.id === f.fieldId)
                          ?.options.find((o) => o.id === v)?.label ?? v,
                    )
                    .join(", ")
                : String(f.value ?? "")}
              {f.upper !== undefined ? ` – ${f.upper}` : ""}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setFilters((fs) => fs.filter((_, j) => j !== i));
                  setPage(1);
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <>
          <Message tone="error">{error}</Message>
          <Button onClick={() => void load()}>Retry</Button>
        </>
      ) : null}
      {busy ? (
        <p role="status">Loading athletes…</p>
      ) : (
        <>
          <p className="text-sm text-surface-muted">
            {total} matching athletes
          </p>
          {!items.length ? (
            <p>No athletes match these filters.</p>
          ) : (
            <AthleteList
              athletes={items.map((a) => ({
                id: a.id,
                name: a.name,
                email: a.email ?? "",
                currentPlanId: a.currentPlanId,
                currentPlanName: a.currentPlanName,
                completionPercent: a.completionPercent ?? null,
                joinedAt: a.linked_at ?? a.requested_at,
                missingMetadataCount: a.missing.length,
              }))}
            />
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              variant="secondary"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
