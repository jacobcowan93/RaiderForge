import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'
import { logMarketplacePersistenceMissing, MARKETPLACE_PERSISTENCE_UNAVAILABLE } from '@/lib/marketplace/messages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

type RouteContext = { params: Promise<{ id: string }> }

// ─── Valid status transitions per actor role ──────────────────────────────────
// All transition logic is enforced server-side; the client only sends the target status.

const BUYER_TRANSITIONS: Record<string, string[]> = {
    pending: ['cancelled'],
    awaiting_payment: ['cancelled'],
    delivered: ['completed', 'disputed'],
    paid: ['disputed'],
    awaiting_delivery: ['disputed'],
}

const SELLER_TRANSITIONS: Record<string, string[]> = {
    pending: ['awaiting_payment', 'cancelled'],
    awaiting_payment: ['paid', 'cancelled'],
    paid: ['awaiting_delivery'],
    awaiting_delivery: ['delivered', 'cancelled'],
}

// ─── GET /api/marketplace/orders/[id] ────────────────────────────────────────
// Auth required. Caller must be buyer or seller for this order.

export async function GET(_req: NextRequest, ctx: RouteContext) {
    const prisma = getPrisma()
    if (!prisma) {
        logMarketplacePersistenceMissing('GET /api/marketplace/orders/[id]')
        return jsonError(503, 'service_unavailable', MARKETPLACE_PERSISTENCE_UNAVAILABLE)
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) return jsonError(401, 'unauthorized', 'Sign in to view this order.')

    const { id } = await ctx.params

    const order = await prisma.marketplaceOrder.findUnique({
        where: { id },
        include: {
            buyer: { select: { name: true, image: true } },
            seller: { select: { name: true, image: true } },
            events: { orderBy: { createdAt: 'asc' } },
        },
    })

    if (!order) return jsonError(404, 'not_found', 'Order not found.')
    if (order.buyerId !== userId && order.sellerId !== userId) {
        return jsonError(403, 'forbidden', 'Access denied.')
    }

    return NextResponse.json({ order: serialize(order) })
}

// ─── PATCH /api/marketplace/orders/[id] ──────────────────────────────────────
// Auth required. Caller must be buyer or seller for this order.
// Body: { status: OrderStatus, note?: string }
//
// Security rules:
//  • caller's role (buyer/seller) determines which transitions are allowed
//  • invalid transitions are rejected with 409
//  • all transitions persisted to MarketplaceOrderEvent

export async function PATCH(req: NextRequest, ctx: RouteContext) {
    const prisma = getPrisma()
    if (!prisma) {
        logMarketplacePersistenceMissing('PATCH /api/marketplace/orders/[id]')
        return jsonError(503, 'service_unavailable', MARKETPLACE_PERSISTENCE_UNAVAILABLE)
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) return jsonError(401, 'unauthorized', 'Sign in to update this order.')

    const { id } = await ctx.params

    let body: unknown
    try { body = await req.json() } catch {
        return jsonError(400, 'validation_error', 'Request body must be JSON.')
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return jsonError(400, 'validation_error', 'Body must be a JSON object.')
    }
    const b = body as Record<string, unknown>
    const targetStatus = typeof b.status === 'string' ? b.status.trim() : ''
    const note = typeof b.note === 'string' ? b.note.trim().slice(0, 500) || null : null

    if (!targetStatus) return jsonError(400, 'validation_error', 'status is required.')

    const result = await prisma.$transaction(async (tx) => {
        const order = await tx.marketplaceOrder.findUnique({ where: { id } })
        if (!order) return { type: 'error' as const, status: 404, error: 'not_found', message: 'Order not found.' }

        const isBuyer = order.buyerId === userId
        const isSeller = order.sellerId === userId
        if (!isBuyer && !isSeller) {
            return { type: 'error' as const, status: 403, error: 'forbidden', message: 'Access denied.' }
        }

        // Determine allowed transitions for this actor
        const allowedTransitions = isSeller
            ? (SELLER_TRANSITIONS[order.status] ?? [])
            : (BUYER_TRANSITIONS[order.status] ?? [])

        if (!allowedTransitions.includes(targetStatus)) {
            return {
                type: 'error' as const,
                status: 409,
                error: 'invalid_transition',
                message: `Cannot move order from "${order.status}" to "${targetStatus}" as ${isSeller ? 'seller' : 'buyer'}.`,
            }
        }

        // Apply transition
        const updated = await tx.marketplaceOrder.update({
            where: { id },
            data: {
                status: targetStatus,
                ...(isSeller && note ? { sellerNote: note } : {}),
                ...(isBuyer && note ? { buyerNote: note } : {}),
            },
        })

        // Log the event
        await tx.marketplaceOrderEvent.create({
            data: {
                orderId: id,
                actorId: userId,
                fromStatus: order.status,
                toStatus: targetStatus,
                note,
            },
        })

        return { type: 'ok' as const, order: updated }
    })

    if (result.type === 'error') {
        return jsonError(result.status, result.error, result.message)
    }

    return NextResponse.json({ order: serializeSimple(result.order) })
}

// ─── Serializers ─────────────────────────────────────────────────────────────

function serializeSimple(o: {
    id: string; listingId: string; buyerId: string; sellerId: string
    ardbItemId: string; itemName: string; itemIconUrl: string | null
    unitPrice: number; currency: string; quantity: number; totalAmount: number
    status: string; buyerNote: string | null; sellerNote: string | null
    createdAt: Date; updatedAt: Date
}) {
    return {
        id: o.id, listingId: o.listingId, buyerId: o.buyerId, sellerId: o.sellerId,
        ardbItemId: o.ardbItemId, itemName: o.itemName, itemIconUrl: o.itemIconUrl ?? null,
        unitPrice: o.unitPrice, currency: o.currency, quantity: o.quantity, totalAmount: o.totalAmount,
        status: o.status, buyerNote: o.buyerNote ?? null, sellerNote: o.sellerNote ?? null,
        createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    }
}

function serialize(order: ReturnType<typeof serializeSimple> extends infer _T ? {
    id: string; listingId: string; buyerId: string; sellerId: string
    ardbItemId: string; itemName: string; itemIconUrl: string | null
    unitPrice: number; currency: string; quantity: number; totalAmount: number
    status: string; buyerNote: string | null; sellerNote: string | null
    createdAt: Date; updatedAt: Date
    buyer: { name: string | null; image: string | null }
    seller: { name: string | null; image: string | null }
    events: Array<{ id: string; actorId: string | null; fromStatus: string | null; toStatus: string; note: string | null; createdAt: Date }>
} : never) {
    return {
        ...serializeSimple(order),
        buyerName: order.buyer.name ?? null,
        buyerImage: order.buyer.image ?? null,
        sellerName: order.seller.name ?? null,
        sellerImage: order.seller.image ?? null,
        events: order.events.map((e) => ({
            id: e.id,
            actorId: e.actorId ?? null,
            fromStatus: e.fromStatus ?? null,
            toStatus: e.toStatus,
            note: e.note ?? null,
            createdAt: e.createdAt.toISOString(),
        })),
    }
}
