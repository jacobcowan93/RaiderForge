import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import DiscordProvider from "next-auth/providers/discord"
import EmailProvider from "next-auth/providers/email"
import { getPrisma } from "@/lib/prisma"

function buildEmailProvider() {
    const from = process.env.EMAIL_FROM?.trim()
    if (!from) return null

    const conn = process.env.EMAIL_SERVER?.trim()
    if (conn) {
        return EmailProvider({ server: conn, from })
    }

    const host = process.env.EMAIL_SERVER_HOST?.trim()
    if (!host) return null

    return EmailProvider({
        server: {
            host,
            port: Number(process.env.EMAIL_SERVER_PORT || 587),
            auth: {
                user: process.env.EMAIL_SERVER_USER || "",
                pass: process.env.EMAIL_SERVER_PASSWORD || "",
            },
        },
        from,
    })
}

function buildProviders(): NextAuthOptions["providers"] {
    const list: NextAuthOptions["providers"] = []

    const googleId = process.env.GOOGLE_CLIENT_ID?.trim()
    const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
    if (googleId && googleSecret) {
        list.push(
            GoogleProvider({
                clientId: googleId,
                clientSecret: googleSecret,
            })
        )
    }

    const discordId = process.env.DISCORD_CLIENT_ID?.trim()
    const discordSecret = process.env.DISCORD_CLIENT_SECRET?.trim()
    if (discordId && discordSecret) {
        list.push(
            DiscordProvider({
                clientId: discordId,
                clientSecret: discordSecret,
            })
        )
    }

    const prisma = getPrisma()
    const emailProvider = buildEmailProvider()
    if (prisma && emailProvider) {
        list.push(emailProvider)
    }

    return list
}

const prisma = getPrisma()
const useDatabase = Boolean(prisma)

export const authOptions: NextAuthOptions = {
    adapter: prisma ? PrismaAdapter(prisma) : undefined,
    providers: buildProviders(),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: useDatabase ? "database" : "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.name = (user as { name?: string | null }).name
                token.email = (user as { email?: string | null }).email
                token.picture = (user as { image?: string | null }).image
                token.sub = (user as { id?: string }).id ?? token.sub
            }
            return token
        },
        async session({ session, user, token }) {
            session.user = session.user ?? { name: null, email: null, image: null }

            if (user) {
                const u = user as {
                    id: string
                    name?: string | null
                    email?: string | null
                    image?: string | null
                }
                ;(session.user as { id?: string }).id = u.id
                session.user.name = u.name
                session.user.email = u.email
                session.user.image = u.image
            } else if (token) {
                ;(session.user as { id?: string }).id = token.sub as string
                session.user.name = token.name as string | null | undefined
                session.user.email = token.email as string | null | undefined
                session.user.image = token.picture as string | null | undefined
            }

            return session
        },
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
