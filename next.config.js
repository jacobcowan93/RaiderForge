/**
 * If you set `basePath` below, also set the same value in env as NEXT_PUBLIC_BASE_PATH so blueprint registry
 * URLs in `public/` resolve correctly on the client (see blueprintReferenceArt.ts).
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    reactStrictMode: true,
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
