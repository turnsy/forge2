import { expect, it } from "vitest";
import { parseExerciseManagement } from "./management-input";
it("accepts explicit rename or archive instructions but rejects ambiguous/empty payloads", () => {
  expect(parseExerciseManagement({ name: "Squat" })).toEqual({ name: "Squat" });
  expect(parseExerciseManagement({ archive: true })).toEqual({ archive: true });
  for (const value of [
    null,
    {},
    { name: "  " },
    { name: "Squat", archive: true },
    { archive: true, replacementId: "bad" },
    { name: "a".repeat(201) },
  ])
    expect(parseExerciseManagement(value)).toBeNull();
});
