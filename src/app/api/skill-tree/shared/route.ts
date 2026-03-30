import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/options"
import { getPrisma } from "@/lib/prisma"

export const runtime = "nodejs"

const MAX_BUILD_NAME_LEN = 60
const MAX_BUILDS_PER_USER = 10
const MAX_BUILD_CODE_LEN = 2000

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

export async function GET() {
    const prisma = getPrisma()
    if (!prisma) return NextResponse.json({ builds: [] })

    const builds = await prisma.sharedSkillTreeBuild.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
            id: true,
            userId: true,
            userName: true,
            buildName: true,
            buildCode: true,
            totalPts: true,
            createdAt: true,
        },
    })

    return NextResponse.json({ builds })
}

export async function POST(req: Request) {
    const prisma = getPrisma()
    if (!prisma) return jsonError(503, "service_unavailable", "Database not available.")

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    const userName = (session?.user as { name?: string } | undefined)?.name ?? null

    if (!userId) return jsonError(401, "unauthorized", "Sign in to share builds.")

    let body: unknown
    try { body = await req.json() } catch { return jsonError(400, "bad_request", "Invalid JSON.") }

    const { buildName, buildCode, totalPts } = body as {
        buildName?: unknown
        buildCode?: unknown
        totalPts?: unknown
    }

    if (typeof buildName !== 'string' || !buildName.trim())
        return jsonError(400, "validation_error", "Build name is required.")
    if (buildName.trim().length > MAX_BUILD_NAME_LEN)
        return jsonError(400, "validation_error", `Build name must be ${MAX_BUILD_NAME_LEN} characters or fewer.`)
    if (typeof buildCode !== 'string' || !buildCode.trim())
        return jsonError(400, "validation_error", "Build code is required.")
    if (buildCode.length > MAX_BUILD_CODE_LEN)
        return jsonError(400, "validation_error", "Build code is too long.")

    const count = await prisma.sharedSkillTreeBuild.count({ where: { userId } })
    if (count >= MAX_BUILDS_PER_USER)
        return jsonError(400, "limit_reached", `You can share at most ${MAX_BUILDS_PER_USER} builds. Delete one to make room.`)

    const build = await prisma.sharedSkillTreeBuild.create({
        data: {
            userId,
            userName,
            buildName: buildName.trim(),
            buildCode: buildCode.trim(),
            totalPts: typeof totalPts === 'number' ? Math.max(0, Math.round(totalPts)) : 0,
        },
    })

    return NextResponse.json({ ok: true, build })
}
