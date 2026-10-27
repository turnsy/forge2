import Ajv from "ajv/dist/2020.js";
import schema from "@/schemas/exercise-management.schema.json";
export type ManagementInput = { name?: string; archive?: boolean; replacementId?: string };
const validate = new Ajv().compile<ManagementInput>(schema);
export function parseExerciseManagement(value: unknown): ManagementInput | null {
  return validate(value) ? value : null;
}
