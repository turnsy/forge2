import { createClient } from "@/utils/supabase/data-client";
import {
  isMissing,
  validateDefinition,
  validateValue,
  convertUnit,
  type Field,
  type Definition,
  type Answer,
  type Snapshot,
  type Value,
} from "./domain";
import { validateFilters, type MetadataFilter } from "./filters";
type FieldRow = {
  id: string;
  coach_id: string;
  definition: Definition;
  version: number;
};
function mapField(row: FieldRow): Field {
  return {
    ...row.definition,
    id: row.id,
    coach_id: row.coach_id,
    version: row.version,
  };
}
export async function listFields(
  coachId: string,
  includeArchived = false,
): Promise<Field[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("athlete_metadata_fields")
    .select("*")
    .eq("coach_id", coachId)
    .order("created_at");
  if (error) throw new Error(error.message);
  return ((data ?? []) as FieldRow[])
    .map(mapField)
    .filter((f) => includeArchived || !f.archived)
    .sort((a, b) => a.position - b.position);
}
export async function getMetadata(
  coachId: string,
  athleteId: string,
): Promise<Snapshot> {
  const db = await createClient();
  const { data: link, error: linkError } = await db
    .from("coach_athletes")
    .select("id")
    .eq("coach_id", coachId)
    .eq("athlete_id", athleteId)
    .is("unlinked_at", null)
    .limit(1)
    .maybeSingle();
  if (linkError || !link)
    throw new Error("Athlete not linked or access denied.");
  const fields = await listFields(coachId);
  const { data, error } = await db
    .from("athlete_metadata_values")
    .select("field_id,value,updated_at,updated_by")
    .eq("coach_id", coachId)
    .eq("athlete_id", athleteId);
  if (error) throw new Error(error.message);
  const values = (data ?? []) as Answer[];
  return {
    fields,
    values,
    missing: fields.filter((f) => {
      if (!f.required) return false;
      const v = values.find((v) => v.field_id === f.id)?.value;
      if (isMissing(v)) return true;
      try {
        validateValue(f, v!);
        return false;
      } catch {
        return true;
      }
    }),
  };
}
export type AnswerInput = {
  fieldId: string;
  version: number;
  value: Value;
  unit?: string;
};
export async function setMetadata(
  coachId: string,
  athleteId: string,
  answers: AnswerInput[],
) {
  if (
    answers.length > 100 ||
    new Set(answers.map((a) => a.fieldId)).size !== answers.length
  )
    throw new Error("Invalid or duplicate answers.");
  const fields = await listFields(coachId);
  const parsed = answers.map((a) => {
    const f = fields.find((f) => f.id === a.fieldId);
    if (!f || f.version !== a.version)
      throw new Error("Field changed. Refresh and try again.");
    let value = a.value;
    if (a.unit && typeof value === "number") {
      if (!f.unit) throw new Error("Field has no unit.");
      value = convertUnit(value, a.unit, f.unit);
      if (f.precision !== undefined) value = Number(value.toFixed(f.precision));
    }
    return {
      fieldId: a.fieldId,
      version: a.version,
      value: validateValue(f, value),
    };
  });
  const db = await createClient();
  const { error } = await db.rpc("set_athlete_metadata", {
    p_coach_id: coachId,
    p_athlete_id: athleteId,
    p_answers: parsed,
  });
  if (error) throw new Error(error.message);
  return getMetadata(coachId, athleteId);
}
export async function saveField(
  coachId: string,
  definition: Definition,
  id?: string,
  version?: number,
) {
  const d = validateDefinition(definition);
  const db = await createClient();
  const query = id
    ? db
        .from("athlete_metadata_fields")
        .update({ definition: d, version: (version ?? 0) + 1 })
        .eq("id", id)
        .eq("coach_id", coachId)
        .eq("version", version ?? 0)
    : db
        .from("athlete_metadata_fields")
        .insert({ coach_id: coachId, definition: d });
  const { data, error } = await query.select().single();
  if (error)
    throw new Error(
      error.code === "PGRST116"
        ? "Field changed. Refresh and try again."
        : error.message,
    );
  const field = mapField(data as FieldRow);
  const impact =
    field.required && !field.archived
      ? await listMetadataAthletes(coachId, {
          filters: [{ fieldId: field.id, op: "missing" }],
          limit: 1,
        })
      : { total: 0 };
  return { field, missingAthleteCount: impact.total };
}
export type MetadataAthlete = {
  id: string;
  relationship_id: string;
  name: string;
  status: "active" | "pending";
  linked_at: string | null;
  requested_at: string;
  missing: string[];
  metadata: Answer[] | null;
  email?: string;
  completionPercent?: number | null;
  currentPlanId: string | null;
  currentPlanName: string | null;
};
export async function listMetadataAthletes(
  coachId: string,
  query: {
    filters?: MetadataFilter[];
    q?: string;
    status?: "active" | "pending";
    page?: number;
    limit?: number;
    includeMetadata?: boolean;
    incomplete?: boolean;
  } = {},
) {
  const filters = validateFilters(
    await listFields(coachId),
    query.filters ?? [],
  );
  const page = Math.max(1, query.page ?? 1),
    limit = Math.min(100, Math.max(1, query.limit ?? 10));
  const db = await createClient();
  const { data, error } = await db.rpc("list_metadata_athletes", {
    p_filters: filters,
    p_search: query.q ?? null,
    p_status: query.status ?? "active",
    p_limit: limit,
    p_offset: (page - 1) * limit,
    p_include: query.includeMetadata ?? false,
    p_incomplete: query.incomplete ?? false,
  });
  if (error) throw new Error(error.message);
  const result = data as { items: MetadataAthlete[]; total: number };
  if (result.items.length && (query.status ?? "active") === "active") {
    const { data: details, error: detailError } = await db.rpc(
      "get_metadata_roster_details",
      { p_athlete_ids: result.items.map((a) => a.id) },
    );
    if (detailError) throw new Error(detailError.message);
    const rows = (details ?? []) as {
      athlete_id: string;
      email: string;
      completion_percent: number | null;
    }[];
    result.items = result.items.map((a) => {
      const row = rows.find((r) => r.athlete_id === a.id);
      return {
        ...a,
        email: row?.email ?? "",
        completionPercent: row?.completion_percent ?? null,
      };
    });
  }
  return { ...result, page, limit, hasMore: page * limit < result.total };
}
export async function metadataHistory(
  coachId: string,
  athleteId: string,
  before?: number,
) {
  await getMetadata(coachId, athleteId);
  const db = await createClient();
  let query = db
    .from("athlete_metadata_value_events")
    .select(
      "*,actor:profiles!athlete_metadata_value_events_actor_id_fkey(full_name,role)",
    )
    .eq("coach_id", coachId)
    .eq("athlete_id", athleteId)
    .order("id", { ascending: false })
    .limit(50);
  if (before) query = query.lt("id", before);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}
