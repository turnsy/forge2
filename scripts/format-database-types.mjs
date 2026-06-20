#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";

const graphqlPublic = `  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }`;

function formatDatabaseTypes(rawInput) {
  let output = rawInput.replace(/\r\n/g, "\n");

  output = output.replace(
    /\n\s*__InternalSupabase:\s*\{[\s\S]*?\}\n/,
    "\n",
  );

  output = output.replace(
    /export type Database = \{\n(?:\s*\/\/.*\n)+/,
    "export type Database = {\n",
  );

  if (!output.includes("graphql_public:")) {
    output = output.replace(
      "export type Database = {",
      `export type Database = {\n${graphqlPublic}`,
    );
  }

  if (!output.includes("graphql_public: {\n    Enums: {}")) {
    output = output.replace(
      "export const Constants = {\n  public:",
      "export const Constants = {\n  graphql_public: {\n    Enums: {},\n  },\n  public:",
    );
  }

  return output.trimEnd() + "\n";
}

const outputPath = process.argv[2];
const input = readFileSync(0, "utf8");
const formatted = formatDatabaseTypes(input);
const banner = "/* AUTO-GENERATED — do not edit */\n";

if (outputPath) {
  writeFileSync(outputPath, banner + formatted);
} else {
  process.stdout.write(banner + formatted);
}
