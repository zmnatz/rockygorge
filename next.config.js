/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: false,
  },
  output: "export",
  distDir: 'build',
}

module.exports = nextConfig
