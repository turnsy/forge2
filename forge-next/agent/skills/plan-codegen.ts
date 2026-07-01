import { buildPythonCodegenRules } from "../lib/plan-codegen-prompt";
import { defineSkill } from "eve/skills";

export default defineSkill({
  description:
    "Python codegen rules and forge_plan API cheat sheet. Load before submit_plan_code.",
  markdown: buildPythonCodegenRules(),
});
