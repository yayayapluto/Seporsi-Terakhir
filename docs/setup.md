# Setup — Human Prerequisites

Do these yourself; the agent must not attempt them.

## 1. Tooling

- **Bun** installed; **Node** matching `.nvmrc` (`v24.21.0`).
- **Docker** (only needed if you want local Supabase; migrations otherwise
  remain unexecuted — see Phase 2 report).

## 2. Google Cloud Console

Create an OAuth client (Web):

1. Authorized redirect URI for **local** Supabase:
   `http://127.0.0.1:54321/auth/v1/callback`
2. Authorized redirect URI for a **hosted** project:
   `https://<project-ref>.supabase.co/auth/v1/callback`

## 3. Supabase

- **Local (via CLI)**: copy `.env.example` to `.env.local`, fill in the anon
  key from `bun run db:start`. Configure the Google provider in
  `supabase/config.toml` from `GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID` /
  `GOTRUE_EXTERNAL_GOOGLE_SECRET`.
- **Hosted dev project**: put the project URL + anon key in `.env.local`, and
  the Google client id/secret in the hosted project's Auth settings.
- Add app redirect URLs to Supabase allowed redirects: `http://localhost:3000`,
  `http://localhost:3000/auth/callback` (plus your deployed URL later).
- If you connect the Supabase MCP to the agent, point it **only at the dev project**.

## 4. Roles without the admin UI (until Phase 6)

```sql
-- approve a tenant application
select approve_tenant('<tenant_id>');
-- make a user admin (dev only)
update public.profiles set role = 'admin' where email = 'you@campus.ac.id';
```

## 5. Google login verification

Real Google sign-in needs the human-provided OAuth credentials above. Until
then, Phase 3 reports login as "needs human verification".
