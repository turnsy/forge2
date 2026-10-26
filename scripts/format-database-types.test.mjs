import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

for (const key of ["graphql_public", '"graphql_public"']) {
  test(`preserves one ${key} schema and constants entry`, () => {
    const input = `export type Database = {\n  ${key}: { Tables: {} }\n  public: {}\n}\nexport const Constants = {\n  ${key}: { Enums: {} },\n  public: {}\n} as const\n`;
    const output = execFileSync(
      process.execPath,
      ["scripts/format-database-types.mjs"],
      { input, encoding: "utf8" },
    );
    assert.equal((output.match(/graphql_public/g) ?? []).length, 2);
    assert.ok(output.startsWith("/* AUTO-GENERATED"));
  });
}

test("adds the GraphQL schema and constants when absent", () => {
  const input =
    "export type Database = {\n  public: {}\n}\nexport const Constants = {\n  public: {}\n} as const\n";
  const output = execFileSync(
    process.execPath,
    ["scripts/format-database-types.mjs"],
    { input, encoding: "utf8" },
  );
  assert.equal((output.match(/graphql_public/g) ?? []).length, 2);
});
