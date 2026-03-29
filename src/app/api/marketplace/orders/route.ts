import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'
import { logMarketplacePersistenceMissing, MARKETPLACE_PERSISTENCE_UNAVAILABLE } from '@/lib/marketplace/messages'
import { readCatalogStore } from '@/lib/marketplace/ardb/catalog-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Statuses that hold inventory — used to compute available quantity. */
const IN_PROGRESS_STATUSES = ['pending', 'awaiting_payment', 'paid', 'awaiting_delivery'] as const

const TERMINAL_STATUSES = new Set(['completed', 'cancelled', 'disputed'])

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

function serializeOrder(order: {
    id: string
    listingId: string
    buyerId: string
    sellerId: string
    ardbItemId: string
    itemName: string
    itemIconUrl: string | null
    unitPrice: number
    currency: string
    quantity: number
    totalAmount: number
    status: string
    buyerNote: string | null
    sellerNote: string | null
    createdAt: Date
    updatedAt: Date
    buyer?: { name: string | null; image: string | null }
    seller?: { name: string | null; image: string | null }
    events?: Array<{
        id: string
        actorId: string | null
        fromStatus: string | null
        toStatus: string
        note: string | null
        createdAt: Date
    }>
}) {
    return {
        id: order.id,
        listingId: order.listingId,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        ardbItemId: order.ardbItemId,
        itemName: order.itemName,
        itemIconUrl: order.itemIconUrl ?? null,
        unitPrice: order.unitPrice,
        currency: order.currency,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
        buyerNote: order.buyerNote ?? null,
        sellerNote: order.sellerNote ?? null,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        buyerName: order.buyer?.name ?? null,
        buyerImage: order.buyer?.image ?? null,
        sellerName: order.seller?.name ?? null,
        sellerImage: order.seller?.image ?? null,
        events: order.events?.map((e) => ({
            id: e.id,
            actorId: e.actorId ?? null,
            fromStatus: e.fromStatus ?? null,
            toStatus: e.toStatus,
            note: e.note ?? null,
            createdAt: e.createdAt.toISOString(),
        })) ?? [],
    }
}

// ─── GET /api/marketplace/orders ─────────────────────────────────────────────
// Auth required. Returns caller's orders.
// Query: role=buyer|seller (default buyer), status, limit

export async function GET(req: NextRequest) {
    const prisma = getPrisma()
    if (!prisma) {
        logMarketplacePersistenceMissing('GET /api/marketplace/orders')
        return jsonError(503, 'service_unavailable', MARKETPLACE_PERSISTENCE_UNAVAILABLE)
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) return jsonError(401, 'unauthorized', 'Sign in to view orders.')

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') === 'seller' ? 'seller' : 'buyer'
    const statusFilter = searchParams.get('status') ?? ''
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '100', 10) || 100, 1), 200)

    const where: Record<string, unknown> = role === 'seller' ? { sellerId: userId } : { buyerId: userId }
    if (statusFilter && statusFilter !== 'all') where.status = statusFilter

    const orders = await prisma.marketplaceOrder.findMany({
        where,
        include: {
            buyer: { select: { name: true, image: true } },
            seller: { select: { name: true, image: true } },
            events: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    })

    return NextResponse.json({ orders: orders.map(serializeOrder) })
}

// ─── POST /api/marketplace/orders ────────────────────────────────────────────
// Auth required. Buyer creates an order from a listing.
// Body: { listingId, quantity?, buyerNote? }
//
// Security rules enforced here:
//  • price always read from listing record — never trusted from client
//  • totalAmount computed server-side
//  • listing must be active
//  • buyer ≠ seller (no self-purchase)
//  • available quantity check (sum of in-progress order quantities)
//  • all DB writes in a single transaction

export async function POST(req: NextRequest) {
    const prisma = getPrisma()
    if (!prisma) {
        logMarketplacePersistenceMissing('POST /api/marketplace/orders')
        return jsonError(503, 'service_unavailable', MARKETPLACE_PERSISTENCE_UNAVAILABLE)
    }

    const session = await getServerSession(authOptions)
    const buyerId = (session?.user as { id?: string } | undefined)?.id
    if (!buyerId) return jsonError(401, 'unauthorized', 'Sign in to place an order.')

    let body: unknown
    try { body = await req.json() } catch {
        return jsonError(400, 'validation_error', 'Request body must be JSON.')
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return jsonError(400, 'validation_error', 'Body must be a JSON object.')
    }
    const b = body as Record<string, unknown>

    const listingId = typeof b.listingId === 'string' ? b.listingId.trim() : ''
    if (!listingId) return jsonError(400, 'validation_error', 'listingId is required.')

    const requestedQty = typeof b.quantity === 'number' ? Math.max(1, Math.floor(b.quantity)) : 1
    const buyerNote = typeof b.buyerNote === 'string' ? b.buyerNote.trim().slice(0, 500) || null : null

    const result = await prisma.$transaction(async (tx) => {
        // 1. Fetch and validate listing
        const listing = await tx.marketplaceListing.findUnique({ where: { id: listingId } })
        if (!listing) return { type: 'error' as const, status: 404, error: 'listing_not_found', message: 'Listing not found.' }
        if (listing.status !== 'active') return { type: 'error' as const, status: 409, error: 'listing_unavailable', message: 'This listing is no longer active.' }

        // 2. Prevent self-purchase
        if (listing.sellerId === buyerId) return { type: 'error' as const, status: 403, error: 'self_purchase', message: 'You cannot purchase your own listing.' }

        // 3. Compute reserved quantity from in-progress orders
        const reserved = await tx.marketplaceOrder.aggregate({
            where: { listingId, status: { in: [...IN_PROGRESS_STATUSES] } },
            _sum: { quantity: true },
        })
        const reservedQty = reserved._sum.quantity ?? 0
        const availableQty = listing.quantity - reservedQty

        if (requestedQty > availableQty) {
            return {
                type: 'error' as const,
                status: 409,
                error: 'insufficient_quantity',
                message: `Only ${availableQty} unit(s) available.`,
            }
        }

        // 4. Lock price from listing — totalAmount computed server-side
        const unitPrice = listing.price
        const totalAmount = Math.round(unitPrice * requestedQty * 100) / 100

        // 5. Enrich item icon from catalog (best-effort; listing.itemIconUrl is the fallback)
        const catalogStore = await readCatalogStore().catch(() => null)
        const catalogIcon = catalogStore?.itemsById[listing.ardbItemId]?.iconUrl ?? listing.itemIconUrl

        // 6. Create order
        const order = await tx.marketplaceOrder.create({
            data: {
                listingId,
                buyerId,
                sellerId: listing.sellerId,
                ardbItemId: listing.ardbItemId,
                itemName: listing.itemName,
                itemIconUrl: catalogIcon ?? null,
                unitPrice,
                currency: listing.currency,
                quantity: requestedQty,
                totalAmount,
                status: 'pending',
                buyerNote,
            },
            include: {
                buyer: { select: { name: true, image: true } },
                seller: { select: { name: true, image: true } },
            },
        })

        // 7. Log the initial event
        await tx.marketplaceOrderEvent.create({
            data: {
                orderId: order.id,
                actorId: buyerId,
                fromStatus: null,
                toStatus: 'pending',
                note: 'Order placed by buyer.',
            },
        })

        return { type: 'ok' as const, order }
    })

    if (result.type === 'error') {
        return jsonError(result.status, result.error, result.message)
    }

    const enriched = {
        ...serializeOrder({ ...result.order, events: [] }),
        buyerName: result.order.buyer.name ?? null,
        buyerImage: result.order.buyer.image ?? null,
        sellerName: result.order.seller.name ?? null,
        sellerImage: result.order.seller.image ?? null,
    }

    return NextResponse.json({ order: enriched }, { status: 201 })
}
