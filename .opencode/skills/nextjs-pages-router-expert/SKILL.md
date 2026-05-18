---
name: nextjs-pages-router-expert
description: Use ONLY when implementing routes, layouts, or page-level logic using the Next.js Pages Router.
---

# Next.js Pages Router Expert

This skill provides expertise in the Next.js Pages Router architecture used in this project.

## Guidelines
- **Routing**: Pages are defined in the `pages/` directory. Use file-based routing conventions.
- **Data Fetching**:
  - Use `getStaticProps` for pages that can be pre-rendered at build time.
  - Use `getServerSideProps` for pages that require server-side rendering per request.
- **Layouts**: Use a persistent layout pattern in `_app.tsx` or wrap page components in a layout component.
- **Custom Documents**: Modify `_document.tsx` only for global HTML/Body tags or external font/script injections.
- **Client-side Navigation**: Use the `next/link` component for internal navigation to enable client-side routing.
