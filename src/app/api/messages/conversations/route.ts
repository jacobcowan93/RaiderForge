import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'
import { serializeConversation } from '../_lib/serialize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return jsonError(401, 'unauthenticated', 'Sign in to view conversations.')

    const prisma = getPrisma()
    if (!prisma) return jsonError(503, 'db_unavailable', 'Database unavailable.')

    const userId = session.user.id

    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [
                { participantAId: userId },
                { participantBId: userId },
            ],
        },
        include: {
            participantA: { select: { id: true, name: true, image: true } },
            participantB: { select: { id: true, name: true, image: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 50,
                select: { id: true, senderId: true, body: true, readAt: true, createdAt: true },
            },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
    })

    return NextResponse.json({
        conversations: conversations.map((c) => serializeConversation(c, userId)),
    })
}
