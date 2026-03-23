import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import DiscordProvider from "next-auth/providers/discord"

const providers: NextAuthOptions["providers"] = [
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID || "",
        clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
]

// NextAuth route for App Router (route handler)
// This file runs on the server only. Client secrets are read from process.env.
export const handler = NextAuth({
    providers,
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        async jwt({ token, user, account }) {
            // Only store minimal info in the token. Do not persist raw access tokens unless needed.
            if (user) {
                token.name = (user as any).name
                token.email = (user as any).email
                token.picture = (user as any).image
                token.sub = (user as any).id // Store the provider's user ID
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user = session.user || {}
                    ; (session.user as any).name = token.name as any
                    ; (session.user as any).email = token.email as any
                    ; (session.user as any).image = token.picture as any
                    ; (session.user as any).id = token.sub as any // Add id to session user
            }
            return session
        }
    }
})

export { handler as GET, handler as POST }
