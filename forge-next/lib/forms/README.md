# Forms

Interactive UI forms use **Zod** schemas and **react-hook-form** with shared primitives under `components/ui/form/`.

- Define schemas in `lib/forms/schemas/<domain>.ts`.
- Parse submitted `FormData` on the server with `parseFormData()` using the same schema.
- Compose fields with `Form`, `FormField`, `FormLabel`, `FormControl`, and `FormMessage`.
- Use `useServerActionForm()` when wiring React 19 Server Actions and `useActionState`.

Structured artifacts and AI I/O remain governed by **JSON Schema** files in the repository root `schemas/` directory. Do not replace those with Zod; keep the two layers separate.
