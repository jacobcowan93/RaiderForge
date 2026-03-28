import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { getPrisma } from "@/lib/prisma"
import type { MapProgressSaveV1 } from "@/lib/maps/mapProgressSave"
import { mapProgressSaveFromJson, parseMapProgressSaveBody } from "@/lib/maps/userMapProgressSaveApi"

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
            "Map progress sync requires DATABASE_URL and a migrated database."
        )
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, "unauthorized", "Sign in to load map progress.")
    }

    const row = await prisma.userMapProgressSave.findUnique({
        where: { userId },
        select: { payload: true },
    })

    if (!row) {
        return NextResponse.json({ save: null as MapProgressSaveV1 | null })
    }

    const save = mapProgressSaveFromJson(row.payload)
    return NextResponse.json({ save })
}

export async function POST(req: Request) {
    const prisma = getPrisma()
    if (!prisma) {
        return jsonError(
            503,
            "service_unavailable",
            "Map progress sync requires DATABASE_URL and a migrated database."
        )
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, "unauthorized", "Sign in to save map progress.")
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return jsonError(400, "validation_error", "Request body must be JSON.")
    }

    const parsed = parseMapProgressSaveBody(body)
    if (parsed.ok === false) {
        return jsonError(400, "validation_error", parsed.error)
    }

    const { save } = parsed

    await prisma.userMapProgressSave.upsert({
        where: { userId },
        create: {
            userId,
            payload: save as object,
        },
        update: {
            payload: save as object,
        },
    })

    return NextResponse.json({ ok: true as const })
}
