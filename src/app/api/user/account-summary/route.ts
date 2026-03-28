import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { getPrisma } from "@/lib/prisma"
import { getBlueprintAllowlistEntries } from "@/lib/blueprints/blueprintSpreadsheetMatcher"

export const runtime = "nodejs"

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

/** Human-readable OAuth / sign-in provider ids from NextAuth `Account.provider`. */
function formatProviderLabel(provider: string): string {
    const key = provider.toLowerCase()
    const map: Record<string, string> = {
        google: "Google",
        discord: "Discord",
        email: "Email",
    }
    return map[key] ?? provider.charAt(0).toUpperCase() + provider.slice(1)
}

export async function GET() {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, "unauthorized", "Sign in to load account summary.")
    }

    const prisma = getPrisma()
    const totalBlueprints = getBlueprintAllowlistEntries().length

    if (!prisma) {
        return NextResponse.json({
            linkedProviders: [] as string[],
            blueprintSync: {
                available: false,
                total: totalBlueprints,
                owned: 0,
                missing: totalBlueprints,
                percent: 0,
            },
        })
    }

    const accounts = await prisma.account.findMany({
        where: { userId },
        select: { provider: true },
    })
    const linkedProviders = [...new Set(accounts.map((a) => a.provider))]
        .sort()
        .map(formatProviderLabel)

    const ownedDb = await prisma.userBlueprintOwnership.count({
        where: { userId, state: "owned" },
    })

    const owned = ownedDb
    const missing = Math.max(0, totalBlueprints - owned)
    const percent =
        totalBlueprints > 0 ? Math.min(100, Math.round((owned / totalBlueprints) * 100)) : 0

    return NextResponse.json({
        linkedProviders,
        blueprintSync: {
            available: true,
            total: totalBlueprints,
            owned,
            missing,
            percent,
        },
    })
}
