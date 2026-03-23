/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack(config) {
        // Allow importing .mp4 / .webm files as URL strings
        config.module.rules.push({
            test: /\.(mp4|webm)$/,
            type: 'asset/resource',
            generator: {
                filename: 'static/media/[name].[hash][ext]',
            },
        })
        return config
    },
}

module.exports = nextConfig
