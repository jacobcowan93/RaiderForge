import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'
import { serializeConversation } from '../_lib/serialize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

const CONV_INCLUDE = {
    participantA: { select: { id: true, name: true, image: true } },
    participantB: { select: { id: true, name: true, image: true } },
    messages: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
        select: { id: true, senderId: true, body: true, readAt: true, createdAt: true },
    },
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return jsonError(401, 'unauthenticated', 'Sign in to start a conversation.')

    const prisma = getPrisma()
    if (!prisma) return jsonError(503, 'db_unavailable', 'Database unavailable.')

    const userId = session.user.id

    let body: { targetUserId?: string }
    try { body = await req.json() } catch { return jsonError(400, 'invalid_json', 'Invalid JSON body.') }
    const { targetUserId } = body

    if (!targetUserId || typeof targetUserId !== 'string') {
        return jsonError(400, 'missing_target', 'targetUserId is required.')
    }
    if (targetUserId === userId) {
        return jsonError(400, 'self_message', 'You cannot message yourself.')
    }

    // Verify target user exists
    const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } })
    if (!target) return jsonError(404, 'user_not_found', 'Target user not found.')

    // Ensure participantAId < participantBId for deduplication
    const [pA, pB] = [userId, targetUserId].sort()

    const conv = await prisma.conversation.upsert({
        where: { participantAId_participantBId: { participantAId: pA, participantBId: pB } },
        create: { participantAId: pA, participantBId: pB },
        update: {},
        include: CONV_INCLUDE,
    })

    return NextResponse.json({ conversation: serializeConversation(conv, userId) })
}
