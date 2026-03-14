# Copilot Instructions (Rocky Gorge)

## Quickstart (what to run)
- `npm install` (once)
- `npm run dev` to start the local Next.js dev server (default port 3000)
- `npm run build` to generate a **static export** into `build/` (Netlify deploys from there)
- `npm run lint` runs `next lint` (eslint + Next.js defaults)

## Project architecture (big picture)
- This is a **Next.js (v13)** site using `output: "export"` (static export) and `pageExtensions` includes `.mdx`.
- Content is a mix of:
  - **Pages**: `pages/*.js`, `pages/*.mdx`, plus dynamic routes in `pages/[id].js` and `pages/forms/[id].js`
  - **Data files**: YAML under `data/*.yml` (loaded via `next-plugin-yaml`)
  - **React components** in `components/` (mostly plain `.jsx` + some `.tsx`)

## Key patterns to follow
- **Data-driven pages**:
  - `data/store.yml` drives the store items list on `/` and the dynamic store pages (`/[id]`).
  - `data/forms.yml` drives the form pages at `/forms/[id]` (renders a Google Forms iframe).
  - To add an item, update the appropriate YAML file (no routing changes required).
- **MDX pages**:
  - Pages like `pages/index.mdx` import components, data, and render JSX.
  - Use `import X from "../components/..."` and write normal JSX in MDX.
- **Ant Design UI**:
  - UI is built with `antd` components (`Row`, `Col`, `Card`, `Typography`, `Carousel`, etc.).
  - Styling is in `pages/app.css` (global CSS is applied via `_app.js`).
- ** Components**:
  - Reusable UI pieces (e.g., `components/PaypalProduct.jsx`) are React components that can be imported into MDX or JS pages.
  - Components can also fetch data (e.g., `useScores.ts` for the score feed) or render dynamic content.
  - Utility functions should appear below the component in the same file (e.g., `components/PaypalProduct.jsx` has `formatPrice` below the main component).

## External integration points
- **Score feed**: `components/Scores/useScores.ts` fetches from `https://rugby-au-cms.graphcdn.app` using a GraphQL POST request.
- **Payments**: `components/PaypalProduct.jsx` uses `@paypal/react-paypal-js` to render checkout flows.
- **Google Forms**: Form pages embed Google Forms via iframe using `formId` from `data/forms.yml`.

## Conventions and gotchas
- The repo is a **static export**: there is no server-side runtime; everything must work in a browser.
- `next.config.js` sets `images.unoptimized = true` (no Next Image optimization) and `output = "export"`.
- Dynamic routes use `getStaticPaths` / `getStaticProps` with YAML data; path keys are case-sensitive.
- Avoid adding server-only code (e.g., Node APIs) as it won't run in the exported output.

## Where to look for common edits
- Change home page content: `pages/index.mdx`
- Add a new store product: `data/store.yml` + optionally tweak `pages/[id].js`
- Add a new form: `data/forms.yml`
- Adjust navigation links: `data/links.yml`
- Update page layout/styles: `pages/app.css` and `components/*`

> If anything is unclear (e.g., why a page is built a certain way or how data is wired), point me to the file(s) and I’ll refine these instructions.