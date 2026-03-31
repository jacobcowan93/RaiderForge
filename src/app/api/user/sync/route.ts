/**
 * POST /api/user/sync
 *
 * Accepts a RaiderForgeImportV1 JSON payload and writes the validated data
 * into existing user tables (UserBlueprintOwnership, UserSkillTreeSave).
 * Records sync metadata in UserProfileSync.
 *
 * Future: when Embark publishes an OAuth API, add a GET handler here that
 * fetches live account data and feeds it through the same import pipeline.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'
import { parseImportPayload, type ParseResult } from '@/lib/sync/importValidator'

export const runtime = 'nodejs'

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

export async function POST(req: Request) {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, 'unauthorized', 'Sign in to import profile data.')
    }

    // ── DB check ──────────────────────────────────────────────────────────────
    const prisma = getPrisma()
    if (!prisma) {
        return jsonError(
            503,
            'service_unavailable',
            'Profile sync requires DATABASE_URL and a migrated database.'
        )
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    let raw: unknown
    try {
        raw = await req.json()
    } catch {
        return jsonError(400, 'validation_error', 'Request body must be valid JSON.')
    }

    // Explicit type annotation ensures the discriminated union narrows correctly
    // before `prisma generate` has been run with the new schema.
    const parsed: ParseResult = parseImportPayload(raw)
    if (parsed.ok === false) {
        return jsonError(400, 'validation_error', parsed.error)
    }

    const { data, warnings } = parsed
    let blueprintsImported = 0
    let skillTreeImported = false
    let anyFailed = false

    // ── Import blueprints ─────────────────────────────────────────────────────
    if (data.blueprints && data.blueprints.owned.length > 0) {
        try {
            await prisma.$transaction(async (tx) => {
                // Replace all owned blueprints — same pattern as /api/user/blueprints
                await tx.userBlueprintOwnership.deleteMany({ where: { userId } })
                await tx.userBlueprintOwnership.createMany({
                    data: data.blueprints!.owned.map((blueprintId) => ({
                        userId,
                        blueprintId,
                        state: 'owned',
                    })),
                })
            })
            blueprintsImported = data.blueprints.owned.length
        } catch {
            warnings.push('Blueprint import failed — other sections may have succeeded.')
            anyFailed = true
        }
    }

    // ── Import skill tree ─────────────────────────────────────────────────────
    if (data.skillTree) {
        try {
            const payload = {
                version: data.skillTree.version,
                allocations: data.skillTree.allocations,
            }
            await prisma.userSkillTreeSave.upsert({
                where: { userId },
                create: { userId, payload },
                update: { payload },
            })
            skillTreeImported = true
        } catch {
            warnings.push('Skill tree import failed — other sections may have succeeded.')
            anyFailed = true
        }
    }

    const status: 'success' | 'partial' =
        anyFailed || (blueprintsImported === 0 && !skillTreeImported)
            ? 'partial'
            : 'success'

    // ── Write sync metadata ───────────────────────────────────────────────────
    // NOTE: requires `prisma generate` after the schema migration is applied.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    try {
        await db.userProfileSync.upsert({
            where: { userId },
            create: {
                userId,
                source: data.source,
                status,
                importedAt: new Date(),
                blueprintsCount: blueprintsImported,
                skillTreeImported,
            },
            update: {
                source: data.source,
                status,
                importedAt: new Date(),
                blueprintsCount: blueprintsImported,
                skillTreeImported,
            },
        })
    } catch {
        // Non-fatal — sync metadata failing shouldn't fail the whole import
    }

    return NextResponse.json({
        ok: true,
        blueprintsImported,
        skillTreeImported,
        warnings,
        status,
    })
}

/**
 * GET /api/user/sync
 * Returns the most recent sync record for the authenticated user.
 */
export async function GET() {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
        return jsonError(401, 'unauthorized', 'Sign in to view sync status.')
    }

    const prisma = getPrisma()
    if (!prisma) {
        return NextResponse.json({ sync: null })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sync = await (prisma as any).userProfileSync.findUnique({
        where: { userId },
        select: {
            source: true,
            status: true,
            importedAt: true,
            blueprintsCount: true,
            skillTreeImported: true,
        },
    })

    return NextResponse.json({ sync })
}
