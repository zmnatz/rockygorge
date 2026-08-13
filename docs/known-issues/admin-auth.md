# Admin auth — known issues and knowledge gaps

Admin route pages (`/admin`, `/admin/[type]`) are protected with client-side
Netlify Identity via `netlify-identity-widget`. This doc records the deliberate
limits of that protection, so a future editor knows the intent behind it.

## What is protected

- The admin **UI** opens the Netlify Identity login modal for unauthenticated
  visitors (`RequireAuth` in `src/components/RequireAuth.tsx`). Signing in is
  enough to see the pages — there is no per-person authorization beyond
  authentication.
- The header only shows the **Admin** link to signed-in visitors
  (`authRequired: true` in `content/links.yml`).
- The admin **save functions** (`/.netlify/functions/admin-*` in
  `netlify/functions/`) reject unauthenticated requests. `AdminPage` sends a
  fresh Netlify Identity JWT (`IdentityProvider.getAccessToken()`, which calls
  the widget's `refresh()`) in the `Authorization: Bearer` header. Netlify
  verifies the JWT's signature and expiry, then injects the user into
  `context.clientContext.user`; `createAdminHandler` returns 401 when that is
  missing. This protects the GitHub-PR write path.

## What is NOT protected

- Any **signed-in** Netlify Identity user can save. There is no per-person
  authorization (role/email allowlist) beyond authentication — anyone invited
  to the site's Identity can edit content.

- The admin page **HTML is publicly downloadable** — the site is statically
  exported (`output: "export"`), so the pages ship to everyone and the login
  flow is client-side UX only.

## How it works

`netlify-identity-widget` is an imperative, browser-only library (it touches
`document` at import time), so it is never imported server-side. Instead,
`IdentityProvider` (`src/components/IdentityProvider.tsx`) dynamically imports
it in a `useEffect` and exposes a small `useIdentity()` React hook
(`{ user, isLoading, login, logout, getAccessToken }`) to the rest of the app.
The provider wraps the whole app in `pages/_app.tsx`.

The widget needs no env vars — it discovers the site's Identity endpoint from
the page's own origin (`/.netlify/identity`), so the Auth0
`NEXT_PUBLIC_AUTH0_*` variables are gone.

## Revisit if

- Any concern about who can edit (beyond "any signed-in user") arises — the
  fix is an email/role allowlist check against an `ADMIN_EMAILS` env var inside
  `netlify/functions/admin-handler.ts`, using `context.clientContext.user.email`.
- Production rollout: make sure **Netlify Identity is enabled** for the site in
  the Netlify dashboard. Without it, `/.netlify/identity` returns 404 and the
  login modal cannot load. Invite editors from the Identity tab so they can
  sign in.

## Local dev

Run `bun run netlify` (`netlify dev`) — the identity endpoint is served by the
Netlify dev server, not by `next dev`. The first time the widget opens on
localhost it prompts for the production SiteURL; that choice is cached in
`localStorage` (`netlifySiteURL`) and can be cleared if it ever points at the
wrong site. Locally, the CLI populates `clientContext.user` by decoding the
Bearer token without verifying its signature — verification only happens in
production.
