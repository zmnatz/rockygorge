### Quick orientation

This is a small Next.js website (Next 13) used as the Rocky Gorge Rugby site. It is a statically-exported Next app (see `next.config.js` -> `output: "export"`) that renders pages from React components and MDX pages under `pages/`.

Key directories
- `pages/` - Next.js pages and MDX content (routes). Examples: `index.mdx`, `slugfest.mdx`, `banquet.mdx`, `hallOfFame/*.mdx`.
- `components/` - React components used by pages. Example components: `PaypalProduct.jsx`, `BanquetTickets.jsx`, `Scores/*`.
- `data/` - YAML data used to generate pages and options (e.g. `store.yml`, `links.yml`, `forms.yml`).
- `assets/` - images used by MDX/JSX.

Why this structure
- The site uses MDX pages for content-heavy routes (hall of fame, event pages) so that non-developers can edit content in `pages/*.mdx` or `sections/*.mdx`.
- Product/store, dues, and donation pages are driven by YAML in `data/store.yml` and rendered using `components/PaypalProduct.jsx` which wires PayPal controls.

Build / developer workflows (explicit commands)
- Install and run dev server (standard Next):

```bash
npm install
npm run dev
```

- Build for static export (Netlify uses this):

```bash
npm run build   # runs `next build`, output directory set to `build` (see next.config.js)
```

- Lint: `npm run lint` (uses `eslint` and `eslint-config-next`).

Deployment notes
- `next.config.js` sets `distDir: 'build'` and `output: 'export'` so `next build` produces a static export under `build/`. `netlify.toml` runs `npm run build` and publishes `build`.

Project-specific patterns and conventions
- MDX first: content authors edit `pages/*.mdx` or `sections/*.mdx`. Imports inside MDX pages commonly reference components with relative paths, e.g. `import PaypalProduct from "../components/PaypalProduct"` in `banquet.mdx`.
- Data-driven pages: `pages/[id].js` uses `getStaticPaths`/`getStaticProps` and reads `data/store.yml` to generate store pages. To add a product, edit `data/store.yml` and the static build will pick it up.
- PayPal integration: `pages/_app.js` provides PayPal client config via `PayPalScriptProvider` (look for `PAYPAL_SETTINGS`). Payments are implemented in `components/PaypalProduct.jsx` which delegates to `@paypal/react-paypal-js` and `PayPalButtons`. Example usage: `pages/banquet.mdx` and `pages/slugfest.mdx`.
- Ant Design: UI primitives are from `antd` (v4). Styles are loaded in `pages/_app.js` with `import "antd/dist/antd.css"` and custom CSS lives in `pages/index.css` and `pages/app.css`.
- YAML data: The project uses `next-plugin-yaml` (see `next.config.js`) so YAML files in `data/` are imported as JS objects. Examples: `data/links.yml`, `data/store.yml`.
- Static export constraints: Because `output: 'export'` is set, server-only features (custom server code, getServerSideProps, API routes) won't work at runtime. The app uses static generation (`getStaticProps` / MDX) and client-side fetches where needed (see `components/Scores/useScores.ts` which fetches a GraphQL endpoint client-side).

Patterns and examples for code edits
- Add a page with MDX + components: create `pages/foo.mdx`, import shared components (`../components/PaypalProduct`) and use existing data YAML for options.
- Update navigation links: edit `data/links.yml`. Header links are filtered in `pages/_app.js` using `links.filter(({header}) => header)`.
- Add a product/subscription: update `data/store.yml` (follow existing entries). `pages/[id].js` maps `items.map(item => ({ params: { id: item.name } }))` for static paths.

External integrations
- PayPal: client ID is in `pages/_app.js` in `PAYPAL_SETTINGS`. `@paypal/react-paypal-js` is used.
- Google Calendar: `components/Calendar.jsx` embeds a public Google Calendar iframe.
- Scores: `components/Scores/useScores.ts` performs a client-side POST to `https://rugby-au-cms.graphcdn.app` to fetch recent scores. Treat this as a runtime client dependency (no server-side auth visible in repo).

Developer gotchas and things to preserve
- Don't convert MDX pages to server-only APIs; the project intentionally outputs a static site.
- `next.config.js` has MDX and YAML plugins; keep them when changing page extensions or data formats.
- `components/PaypalProduct.jsx` contains imperative PayPal order creation logic. If changing payment flows, update `createOrder` / `onApprove` hooks consistently across pages that use the component.
- Image optimization is disabled (`images: { unoptimized: true }`) because the site is statically exported. If you change image handling, test static export and Netlify publishing.

Files to inspect for related changes
- `pages/_app.js` - global app wiring and PayPal config
- `components/PaypalProduct.jsx` - PayPal buttons and flows
- `pages/[id].js` - static product routing pattern
- `data/store.yml`, `data/links.yml` - editable YAML content driving UI
- `next.config.js` - MDX/YAML plugin & export settings

If you edit or add new pages/components, run `npm run build` locally to validate static export. If anything requires server-side runtime (API keys, server auth), note it in the PR and suggest how to port to client-side or Netlify Functions.

Questions I might ask back
- Do you want PayPal client ID removed from the repo and added to env-backed Netlify variables? (This is recommended for production.)
- Any preferred lints or formatting rules to add (prettier, husky) to standardize contributions?

Please review this draft and tell me any gaps or decisions you want recorded; I will iterate quickly.
