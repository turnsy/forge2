import Ajv2020 from "ajv/dist/2020.js";
import { NextResponse } from "next/server";
import schema from "@/schemas/athlete-max-input.schema.json";
import { insertAthleteMax } from "./mutations";
import { normalizeWeightUnit } from "./units";

type MaxInput = { exerciseId: string; value: number; unit: "kg" | "lb" };
const validate = new Ajv2020().compile<MaxInput>(schema);

export function parseMaxInput(value: unknown): MaxInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const normalized = {
    ...body,
    unit: typeof body.unit === "string" ? normalizeWeightUnit(body.unit) : null,
  };
  return validate(normalized) ? normalized : null;
}

export async function createMaxResponse(
  request: Request,
  athleteId: string,
  source: "coach_entered" | "athlete_entered",
) {
  const body = parseMaxInput(await request.json().catch(() => null));
  if (!body)
    return NextResponse.json(
      { error: "Select an exercise and enter a positive max in kg or lb." },
      { status: 400 },
    );
  try {
    const max = await insertAthleteMax({ athleteId, ...body, source });
    return NextResponse.json({ max }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string }).code;
    return NextResponse.json(
      {
        error:
          code === "P0002"
            ? "Athlete or exercise not found."
            : "Could not save max.",
      },
      { status: code === "P0002" ? 404 : code === "22023" ? 400 : 500 },
    );
  }
}
