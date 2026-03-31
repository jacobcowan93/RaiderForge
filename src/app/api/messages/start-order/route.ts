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

    let body: { orderId?: string }
    try { body = await req.json() } catch { return jsonError(400, 'invalid_json', 'Invalid JSON body.') }
    const { orderId } = body

    if (!orderId || typeof orderId !== 'string') {
        return jsonError(400, 'missing_order', 'orderId is required.')
    }

    // Load the order — user must be buyer or seller
    const order = await prisma.marketplaceOrder.findUnique({
        where: { id: orderId },
        select: { id: true, buyerId: true, sellerId: true },
    })
    if (!order) return jsonError(404, 'order_not_found', 'Order not found.')
    if (order.buyerId !== userId && order.sellerId !== userId) {
        return jsonError(403, 'forbidden', 'You are not a participant in this order.')
    }

    // Ensure participantAId < participantBId
    const [pA, pB] = [order.buyerId, order.sellerId].sort()

    // Check if a non-order conv already exists between these two users
    const existing = await prisma.conversation.findFirst({
        where: { participantAId: pA, participantBId: pB, orderId: orderId },
        include: CONV_INCLUDE,
    })
    if (existing) {
        return NextResponse.json({ conversation: serializeConversation(existing, userId) })
    }

    // Upsert by orderId unique constraint
    const conv = await prisma.conversation.upsert({
        where: { orderId },
        create: { participantAId: pA, participantBId: pB, orderId },
        update: {},
        include: CONV_INCLUDE,
    })

    return NextResponse.json({ conversation: serializeConversation(conv, userId) })
}
