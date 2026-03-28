import "server-only"

/** Mirrors which providers are registered in the NextAuth route (for sign-in UI only). */
export function getSignInUiFlags() {
    const google =
        Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
        Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim())
    const discord =
        Boolean(process.env.DISCORD_CLIENT_ID?.trim()) &&
        Boolean(process.env.DISCORD_CLIENT_SECRET?.trim())

    const from = Boolean(process.env.EMAIL_FROM?.trim())
    const smtp =
        Boolean(process.env.EMAIL_SERVER?.trim()) ||
        Boolean(process.env.EMAIL_SERVER_HOST?.trim())
    const emailMagicLink =
        Boolean(process.env.DATABASE_URL?.trim()) && from && smtp

    return { google, discord, emailMagicLink }
}
