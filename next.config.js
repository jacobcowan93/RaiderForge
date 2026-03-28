/**
 * If you set `basePath` below, also set the same value in env as NEXT_PUBLIC_BASE_PATH so blueprint registry
 * URLs in `public/` resolve correctly on the client (see blueprintReferenceArt.ts).
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    reactStrictMode: true,
}

module.exports = nextConfig
