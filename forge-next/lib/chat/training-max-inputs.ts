import Ajv from "ajv/dist/2020.js";
import type { InputRequest } from "eve/client";
import schema from "@/schemas/training-max-fields.schema.json";
export type TrainingMaxField = {
  id: string;
  label: string;
  athleteId: string;
  exerciseId: string;
  unit: "kg" | "lb";
  value?: number;
};
export type TrainingMaxAnswer = TrainingMaxField & { value: number };
const validate = new Ajv().compile<TrainingMaxField[]>(schema);
export function trainingMaxFields(request: InputRequest): TrainingMaxField[] {
  const value = request.action.input.maxInputs;
  return validate(value) && new Set(value.map((item) => item.id)).size === value.length
    ? value
    : [];
}
