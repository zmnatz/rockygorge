/** @type {import('next').NextConfig} */
// Built and served by Netlify's Next.js runtime, which Netlify adds for a Next site
// (docs/adr/014-nextjs-runtime.md). Images stay unoptimized, served as they are.
const nextConfig = {
  images: { unoptimized: true },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
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
