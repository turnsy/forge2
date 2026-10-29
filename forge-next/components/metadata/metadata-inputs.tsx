"use client";
import { Input, Select } from "@/components/ui";
import type { Field, Value } from "@/lib/metadata/domain";
export function MetadataInputs({
  fields,
  values,
  onChange,
  disabled = false,
}: {
  fields: Field[];
  values: Record<string, Value>;
  onChange: (id: string, value: Value) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const value = values[field.id] ?? null;
        const label = `${field.label}${field.unit ? ` (${field.unit})` : ""}${field.required ? " · Required" : ""}`;
        let control;
        if (field.type === "boolean" || field.type === "single_select")
          control = (
            <Select
              aria-label={label}
              value={value === null ? "" : String(value)}
              disabled={disabled}
              onChange={(e) =>
                onChange(
                  field.id,
                  e.target.value === ""
                    ? null
                    : field.type === "boolean"
                      ? e.target.value === "true"
                      : e.target.value,
                )
              }
            >
              <option value="">Unanswered</option>
              {field.type === "boolean" ? (
                <>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </>
              ) : (
                field.options
                  .filter((o) => !o.archived || o.id === value)
                  .map((o) => (
                    <option key={o.id} value={o.id} disabled={o.archived}>
                      {o.label}
                      {o.archived ? " (retired)" : ""}
                    </option>
                  ))
              )}
            </Select>
          );
        else if (field.type === "multi_select")
          control = (
            <div role="group" aria-label={label} className="space-y-2">
              {field.options
                .filter(
                  (o) =>
                    !o.archived ||
                    (Array.isArray(value) && value.includes(o.id)),
                )
                .map((o) => (
                  <label key={o.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={Array.isArray(value) && value.includes(o.id)}
                      onChange={(e) => {
                        const ids = Array.isArray(value) ? value : [];
                        onChange(
                          field.id,
                          e.target.checked
                            ? [...ids, o.id]
                            : ids.filter((id) => id !== o.id),
                        );
                      }}
                    />
                    {o.label}
                    {o.archived ? " (retired)" : ""}
                  </label>
                ))}
            </div>
          );
        else
          control = (
            <Input
              aria-label={label}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "date"
                    ? "date"
                    : "text"
              }
              min={field.type === "number" ? field.min : undefined}
              max={
                field.type === "number"
                  ? field.max
                  : field.semantic === "birth_date"
                    ? new Date().toISOString().slice(0, 10)
                    : undefined
              }
              step={
                field.type === "number"
                  ? field.precision === undefined
                    ? "any"
                    : 10 ** -field.precision
                  : undefined
              }
              maxLength={field.maxLength ?? 10000}
              value={value === null ? "" : String(value)}
              disabled={disabled}
              onChange={(e) =>
                onChange(
                  field.id,
                  e.target.value === ""
                    ? null
                    : field.type === "number"
                      ? Number(e.target.value)
                      : e.target.value,
                )
              }
            />
          );
        return (
          <fieldset key={field.id} className="space-y-1">
            <legend className="text-sm font-medium">{label}</legend>
            {field.description ? (
              <p className="text-sm text-surface-muted">{field.description}</p>
            ) : null}
            {control}
          </fieldset>
        );
      })}
    </div>
  );
}
