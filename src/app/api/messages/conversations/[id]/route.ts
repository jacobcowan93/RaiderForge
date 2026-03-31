import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'
import { serializeConversation, serializeMessage } from '../../_lib/serialize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

async function getConvForUser(prisma: ReturnType<NonNullable<typeof getPrisma>>, id: string, userId: string) {
    return prisma!.conversation.findFirst({
        where: {
            id,
            OR: [{ participantAId: userId }, { participantBId: userId }],
        },
        include: {
            participantA: { select: { id: true, name: true, image: true } },
            participantB: { select: { id: true, name: true, image: true } },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { id: true, senderId: true, body: true, readAt: true, createdAt: true },
            },
        },
    })
}

// ─── GET: all messages in thread ──────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return jsonError(401, 'unauthenticated', 'Sign in to read messages.')

    const prisma = getPrisma()
    if (!prisma) return jsonError(503, 'db_unavailable', 'Database unavailable.')

    const userId = session.user.id
    const { id } = await params

    const conv = await getConvForUser(prisma, id, userId)
    if (!conv) return jsonError(404, 'not_found', 'Conversation not found.')

    const messages = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
        take: 200,
    })

    return NextResponse.json({
        conversation: serializeConversation(conv, userId),
        messages: messages.map(serializeMessage),
    })
}

// ─── POST: send a message ─────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return jsonError(401, 'unauthenticated', 'Sign in to send messages.')

    const prisma = getPrisma()
    if (!prisma) return jsonError(503, 'db_unavailable', 'Database unavailable.')

    const userId = session.user.id
    const { id } = await params

    const conv = await getConvForUser(prisma, id, userId)
    if (!conv) return jsonError(404, 'not_found', 'Conversation not found.')

    let body: { body?: string }
    try { body = await req.json() } catch { return jsonError(400, 'invalid_json', 'Invalid JSON body.') }

    const text = typeof body.body === 'string' ? body.body.trim() : ''
    if (!text) return jsonError(400, 'empty_body', 'Message body cannot be empty.')
    if (text.length > 2000) return jsonError(400, 'too_long', 'Message exceeds 2000 characters.')

    const [message] = await prisma.$transaction([
        prisma.message.create({
            data: { conversationId: id, senderId: userId, body: text },
        }),
        prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        }),
    ])

    return NextResponse.json({ message: serializeMessage(message) }, { status: 201 })
}
