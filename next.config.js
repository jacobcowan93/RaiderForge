/**
 * If you set `basePath` below, also set the same value in env as NEXT_PUBLIC_BASE_PATH so blueprint registry
 * URLs in `public/` resolve correctly on the client (see blueprintReferenceArt.ts).
 *
 * `experimental.turbopack.root`: pin to this repo so Next does not infer a parent folder when multiple
 * lockfiles exist (e.g. ~/package-lock.json) — wrong root breaks Tailwind / node_modules resolution.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    reactStrictMode: true,
    experimental: {
        turbopack: {
            root: __dirname,
        },
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'metaforge.app', pathname: '/**' },
            { protocol: 'https', hostname: 'www.metaforge.app', pathname: '/**' },
            { protocol: 'https', hostname: 'cdn.metaforge.app', pathname: '/**' },
            { protocol: 'https', hostname: 'unhbvkszwhczbjxgetgk.supabase.co', pathname: '/**' },
        ],
    },
    /** Short TCNO-style paths → hub (avoid colliding with /maps/[mapId] tactical routes). */
    async redirects() {
        return [
            { source: '/maps/dam', destination: '/maps/hub/dam', permanent: false },
            { source: '/maps/buried', destination: '/maps/hub/buried', permanent: false },
            { source: '/maps/bluegate', destination: '/maps/hub/bluegate', permanent: false },
            { source: '/maps/stella', destination: '/maps/hub/stella', permanent: false },
        ]
    },
}

module.exports = nextConfig
