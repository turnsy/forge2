# Preview authentication

Hosted Supabase Auth URL configuration is managed separately from
`supabase/config.toml`, which configures local development.

For the `forge2` Supabase project (`xidptatroxjiqoyvhnzi`), configure:

- Site URL: `https://forge2-omega.vercel.app`
- Production redirect URL: `https://forge2-omega.vercel.app/**`
- Preview redirect URL: `https://forge2-*-turnsys-projects.vercel.app/**`
- Local redirect URL: `http://localhost:3000/**`

Keep `NEXT_PUBLIC_SITE_URL` scoped to production in Vercel. Preview deployments
must resolve the request's own origin so the PKCE cookie and callback stay on
the same hostname.

If a preview callback is not allowed, Supabase falls back to its Site URL.
An obsolete `forge-next-git-*` allow-list entry does not match `forge2` previews.
Changing local CLI configuration does not update the hosted Auth configuration.

## Verify

Open a PR preview, start Google sign-in, and confirm the Supabase authorize URL
contains `redirect_to` pointing to that preview's `/auth/callback` route. After
Google sign-in, verify that the browser returns to the same preview hostname
and reaches the authenticated coach or athlete experience.

The hosted URL settings were corrected on October 25, 2026. Existing previews
can use the updated allow-list without a rebuild.
