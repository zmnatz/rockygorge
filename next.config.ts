/** @type {import('next').NextConfig} */
// Built and served by Netlify's Next.js runtime, which Netlify adds for a Next site
// (docs/adr/014-nextjs-runtime.md). Images stay unoptimized, served as they are.

// The player page is rendered on request, and its function doesn't carry the player
// snapshots (about 30 MB): it reads the one it needs from its own deploy's copy of
// public/data on the CDN (ADR 016). DEPLOY_URL is the deploy's permalink, set by Netlify at
// build time, so a function reads its own deploy's data, never a later one's. A build
// without it (local, CI) reads the disk.
const DEPLOY_URL = process.env.DEPLOY_URL ?? '';

const nextConfig = {
  images: { unoptimized: true },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  env: { PUBLISHED_DATA_URL: DEPLOY_URL ? `${DEPLOY_URL.replace(/\/+$/, '')}/data` : '' },
  // Next's trace finds the directory the build reads the snapshots from and would bundle
  // all of public/data, so every route excludes it.
  outputFileTracingExcludes: { '/**': ['./public/data/**'] },
  experimental: {
    useTypeScriptCli: true,
  },
  turbopack: {
    rules: {
      '*.yml': {
        loaders: ['yaml-loader'],
        as: '*.js',
      },
      '*.yaml': {
        loaders: ['yaml-loader'],
        as: '*.js',
      },
    },
  },
}

const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    // If you use remark-gfm, you'll need to use next.config.mjs
    // as the package is ESM only
    // https://github.com/remarkjs/remark-gfm#install
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    providerImportSource: "@mdx-js/react",
  },
});

export default withMDX(nextConfig);
