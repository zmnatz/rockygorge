# Admin auth — known issues and knowledge gaps

Admin route pages (`/admin`, `/admin/[type]`) are protected with client-side
Auth0 via `@auth0/auth0-react`. This doc records the deliberate limits of that
protection, so a future editor knows the intent behind it.

## What is protected

- The admin **UI** redirects unauthenticated visitors to Auth0 Universal Login
  (`RequireAuth` in `src/components/RequireAuth.tsx`). Signing in is enough to
  see the pages — there is no per-person authorization beyond authentication.

## What is NOT protected

- The admin **save functions** (`/.netlify/functions/admin-*` in
  `netlify/functions/`) are unauthenticated. Anyone can POST to them and
  trigger a GitHub PR that modifies live content, using `GITHUB_TOKEN`. This
  was a deliberate scope decision (client-side-only auth), not an oversight.

- The admin page **HTML is publicly downloadable** — the site is statically
  exported (`output: "export"`), so the pages ship to everyone and the login
  redirect is client-side UX only.

## Why

The initial ask was "protect the admin routes" and the tenant was set up for a
client-side SPA. Securing the write path properly requires either verifying an
audience-scoped access token in each function (`jose` + an Auth0 API) or a
`/userinfo` allowlist check against an `ADMIN_EMAILS` env var. Both were
discussed and declined in favor of simplicity.

## Revisit if

- Any concern about the write path being open arises — the fix is a shared
  `requireAuth` guard inside `netlify/functions/admin-handler.ts` (called from
  the POST branch), plus sending the access token from `AdminPage`. The UI
  work does not need to change.
- Production rollout: remember the Auth0 app only has the
  `http://localhost:5173` origin configured. Add `https://rockygorgerugby.com`
  to Allowed Callback URLs, Allowed Logout URLs, and Web Origins.

## Local dev

The Auth0 application is locked to `http://localhost:5173`. The site must be
served on that port (`netlify dev -p 5173`) or login callbacks will mismatch.
`netlify dev` is required anyway — `next dev` does not serve the Netlify
functions the admin save flow calls.
