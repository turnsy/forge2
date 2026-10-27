# forge-next

This is the home for the NextJS frontend of Forge. Routes are grouped by `athlete`, `coach`, serving different users.

## Production builds

Run `pnpm build` from this directory. It builds Eve before Next.js; a local
`next build` alone does not prepare the Eve runtime. The generated
Vercel Eve service also uses `pnpm build:eve`.

Deploy on Vercel from source (Git integration or `vercel deploy`), with system
environment variables exposed to the build. Both `VERCEL_DEPLOYMENT_ID` and
`VERCEL_PROJECT_ID` must be present: Eve provisions the plan sandbox during its
Vercel build, and the project identity must match the runtime so it looks up the
same template. Missing identity fails the build instead of shipping an agent
that fails on the first plan-generation request. Do not deploy local build
output with `vercel deploy --prebuilt`.

After enabling system variables, redeploy from source and verify that the Eve
build log reports `initialized 1 sandbox template`. Then test a conversation
with multiple replies and a plan-generation request. A successful local build
does not verify hosted sandbox provisioning; it requires Vercel authentication
and the production project's deployment context.
