import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return jsonError(401, 'unauthenticated', 'Sign in to mark messages read.')

    const prisma = getPrisma()
    if (!prisma) return jsonError(503, 'db_unavailable', 'Database unavailable.')

    const userId = session.user.id
    const { id } = await params

    // Verify user is a participant
    const conv = await prisma.conversation.findFirst({
        where: {
            id,
            OR: [{ participantAId: userId }, { participantBId: userId }],
        },
        select: { id: true },
    })
    if (!conv) return jsonError(404, 'not_found', 'Conversation not found.')

    const now = new Date()
    await prisma.message.updateMany({
        where: {
            conversationId: id,
            senderId: { not: userId },
            readAt: null,
        },
        data: { readAt: now },
    })

    return NextResponse.json({ ok: true })
}
