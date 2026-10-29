"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Message, Button } from "@/components/ui";
import { MetadataInputs } from "@/components/metadata/metadata-inputs";
import { metadataRequest } from "@/lib/metadata/client";
import { validateValue, type Field, type Value } from "@/lib/metadata/domain";
export function AthleteLinkForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [fields, setFields] = useState<Field[] | null>(null);
  const [values, setValues] = useState<Record<string, Value>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(skip = false) {
    setBusy(true);
    setError("");
    try {
      if (fields === null) {
        const data = await metadataRequest<{ fields: Field[] }>(
          "/api/metadata/invite",
          { code },
        );
        setFields(data.fields);
      } else {
        const answers = skip
          ? []
          : fields
              .filter((f) => values[f.id] !== undefined)
              .map((f) => ({
                fieldId: f.id,
                version: f.version,
                value: validateValue(f, values[f.id]),
              }));
        await metadataRequest("/api/metadata/invite", { code, answers });
        router.refresh();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="w-full max-w-lg space-y-4">
      <p className="text-sm text-surface-muted">
        {fields === null
          ? "Enter your coach’s invite code to request a link."
          : "Complete your coach’s profile questions. You can leave answers blank and complete them later."}
      </p>
      {error ? <Message tone="error">{error}</Message> : null}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {fields === null ? (
          <Input
            aria-label="Invite code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Invite code"
            autoComplete="off"
          />
        ) : fields.length ? (
          <MetadataInputs
            fields={fields}
            values={values}
            onChange={(id, value) => setValues((v) => ({ ...v, [id]: value }))}
            disabled={busy}
          />
        ) : (
          <p>Your coach has no profile questions yet.</p>
        )}
        <Button type="submit" disabled={busy}>
          {busy
            ? "Submitting…"
            : fields === null
              ? "Continue"
              : "Submit link request"}
        </Button>
      </form>
      {fields !== null ? (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setFields(null);
              setValues({});
              setError("");
            }}
          >
            Back
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void submit(true)}
          >
            Submit and complete later
          </Button>
        </div>
      ) : null}
    </div>
  );
}
