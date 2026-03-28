import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { getPrisma } from "@/lib/prisma"
import { parseBlueprintOwnershipEntries } from "@/lib/blueprints/userBlueprintOwnershipApi"
import type { BlueprintTrackState } from "@/lib/blueprints/blueprintTrackingStorage"

export const runtime = "nodejs"

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

export async function GET() {
    const prisma = getPrisma()
    if (!prisma) {
        return jsonError(
            503,
            "service_unavailable",
            "Blueprint sync requires DATABASE_URL and a migrated database."
        )
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, "unauthorized", "Sign in to load blueprint ownership.")
    }

    const rows = await prisma.userBlueprintOwnership.findMany({
        where: { userId },
        select: { blueprintId: true, state: true },
    })

    const entries: Record<string, BlueprintTrackState> = {}
    for (const r of rows) {
        if (r.state === "owned" || r.state === "tracking") {
            entries[r.blueprintId] = r.state as BlueprintTrackState
        }
    }

    return NextResponse.json({ entries })
}

export async function POST(req: Request) {
    const prisma = getPrisma()
    if (!prisma) {
        return jsonError(
            503,
            "service_unavailable",
            "Blueprint sync requires DATABASE_URL and a migrated database."
        )
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, "unauthorized", "Sign in to save blueprint ownership.")
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return jsonError(400, "validation_error", "Request body must be JSON.")
    }

    const parsed = parseBlueprintOwnershipEntries(body)
    if (!parsed.ok) {
        return jsonError(400, "validation_error", parsed.error)
    }

    const { entries } = parsed

    await prisma.$transaction(async (tx) => {
        await tx.userBlueprintOwnership.deleteMany({ where: { userId } })
        if (Object.keys(entries).length === 0) return
        await tx.userBlueprintOwnership.createMany({
            data: Object.entries(entries).map(([blueprintId, state]) => ({
                userId,
                blueprintId,
                state,
            })),
        })
    })

    return NextResponse.json({ ok: true as const, count: Object.keys(entries).length })
}
