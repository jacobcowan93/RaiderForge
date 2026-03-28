import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { getPrisma } from "@/lib/prisma"
import type { SkillTreeSaveV1 } from "@/lib/skill-tree/skillTreeSave"
import { parseSkillTreeSaveBody, skillTreeSaveFromJson } from "@/lib/skill-tree/userSkillTreeSaveApi"

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
            "Skill tree sync requires DATABASE_URL and a migrated database."
        )
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, "unauthorized", "Sign in to load skill tree saves.")
    }

    const row = await prisma.userSkillTreeSave.findUnique({
        where: { userId },
        select: { payload: true },
    })

    if (!row) {
        return NextResponse.json({ save: null as SkillTreeSaveV1 | null })
    }

    const save = skillTreeSaveFromJson(row.payload)
    return NextResponse.json({ save })
}

export async function POST(req: Request) {
    const prisma = getPrisma()
    if (!prisma) {
        return jsonError(
            503,
            "service_unavailable",
            "Skill tree sync requires DATABASE_URL and a migrated database."
        )
    }

    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, "unauthorized", "Sign in to save skill tree builds.")
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return jsonError(400, "validation_error", "Request body must be JSON.")
    }

    const parsed = parseSkillTreeSaveBody(body)
    if (parsed.ok === false) {
        return jsonError(400, "validation_error", parsed.error)
    }

    const { save } = parsed

    await prisma.userSkillTreeSave.upsert({
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
