import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'
import { readCatalogStore } from '@/lib/marketplace/ardb/catalog-store'
import { logMarketplacePersistenceMissing, MARKETPLACE_PERSISTENCE_UNAVAILABLE } from '@/lib/marketplace/messages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD']
const MAX_NOTES_LEN = 500
const MAX_LISTING_PAGE = 200

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

// ─── GET /api/marketplace/listings ───────────────────────────────────────────
// Public. Returns active (or filtered) listings with denormalized item data.
// Query params:
//   status   – active (default) | sold | cancelled | all
//   q        – filter by item name (case-insensitive substring)
//   type     – filter by itemType (matched against catalog; best-effort)
//   sellerId – filter to a specific seller (for "my listings" in the Sell tab)
//   limit    – max results, 1–200 (default 60)

export async function GET(req: NextRequest) {
    const prisma = getPrisma()
    if (!prisma) {
        logMarketplacePersistenceMissing('GET /api/marketplace/listings')
        return jsonError(503, 'service_unavailable', MARKETPLACE_PERSISTENCE_UNAVAILABLE)
    }

    const { searchParams } = new URL(req.url)
    const rawStatus = searchParams.get('status') ?? 'active'
    const q = searchParams.get('q')?.trim().toLowerCase() ?? ''
    const sellerId = searchParams.get('sellerId') ?? ''
    const limitParam = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '60', 10) || 60, 1), MAX_LISTING_PAGE)

    const where: Record<string, unknown> = {}
    if (rawStatus !== 'all') {
        where.status = rawStatus
    }
    if (sellerId) {
        where.sellerId = sellerId
    }

    const rows = await prisma.marketplaceListing.findMany({
        where,
        include: {
            seller: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limitParam,
    })

    // Optional client-side name search (Prisma SQLite doesn't support case-insensitive contains natively)
    const filtered = q
        ? rows.filter((r) => r.itemName.toLowerCase().includes(q))
        : rows

    // Compute reserved quantities from in-progress orders
    const listingIds = filtered.map((r) => r.id)
    const reservedAgg = listingIds.length > 0
        ? await prisma.marketplaceOrder.groupBy({
            by: ['listingId'],
            where: {
                listingId: { in: listingIds },
                status: { in: ['pending', 'awaiting_payment', 'paid', 'awaiting_delivery'] },
            },
            _sum: { quantity: true },
        })
        : []
    const reservedByListingId = new Map(reservedAgg.map((r) => [r.listingId, r._sum.quantity ?? 0]))

    // Enrich with catalog metadata for itemType (used by client for filter chips)
    const store = await readCatalogStore().catch(() => null)
    const itemsById = store?.itemsById ?? {}

    const listings = filtered.map((r) => {
        const catalogItem = itemsById[r.ardbItemId] ?? null
        const reserved = reservedByListingId.get(r.id) ?? 0
        return {
            id: r.id,
            sellerId: r.sellerId,
            sellerName: r.seller.name ?? null,
            sellerImage: r.seller.image ?? null,
            ardbItemId: r.ardbItemId,
            itemName: r.itemName,
            itemIconUrl: r.itemIconUrl ?? null,
            itemType: catalogItem?.itemType ?? null,
            itemDescription: catalogItem?.description ?? null,
            itemRarity: catalogItem?.rarity ?? null,
            price: r.price,
            currency: r.currency,
            quantity: r.quantity,
            availableQuantity: Math.max(0, r.quantity - reserved),
            status: r.status,
            notes: r.notes ?? null,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
        }
    })

    return NextResponse.json({ listings })
}

// ─── POST /api/marketplace/listings ──────────────────────────────────────────
// Auth required. Creates a new listing. Validates item against synced catalog.

export async function POST(req: NextRequest) {
    const prisma = getPrisma()
    if (!prisma) {
        logMarketplacePersistenceMissing('POST /api/marketplace/listings')
        return jsonError(503, 'service_unavailable', MARKETPLACE_PERSISTENCE_UNAVAILABLE)
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) {
        return jsonError(401, 'unauthorized', 'Sign in to create a listing.')
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return jsonError(400, 'validation_error', 'Request body must be JSON.')
    }

    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return jsonError(400, 'validation_error', 'Body must be a JSON object.')
    }

    const b = body as Record<string, unknown>
    const ardbItemId = typeof b.ardbItemId === 'string' ? b.ardbItemId.trim() : ''
    const price = typeof b.price === 'number' ? b.price : parseFloat(String(b.price ?? ''))
    const currency = typeof b.currency === 'string' ? b.currency.toUpperCase().trim() : 'USD'
    const quantity = typeof b.quantity === 'number' ? Math.max(1, Math.floor(b.quantity)) : 1
    const notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, MAX_NOTES_LEN) : null

    if (!ardbItemId) return jsonError(400, 'validation_error', 'ardbItemId is required.')
    if (!Number.isFinite(price) || price <= 0) return jsonError(400, 'validation_error', 'price must be a positive number.')
    if (!ALLOWED_CURRENCIES.includes(currency)) {
        return jsonError(400, 'validation_error', `currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}.`)
    }

    // Validate item exists in the local ARDB-synced catalog
    const store = await readCatalogStore().catch(() => null)
    const catalogItem = store?.itemsById[ardbItemId] ?? null
    if (!catalogItem) {
        return jsonError(404, 'item_not_found', 'Item not found in the synced ARDB catalog. Trigger a catalog sync and retry.')
    }

    const listing = await prisma.marketplaceListing.create({
        data: {
            sellerId: userId,
            ardbItemId,
            itemName: catalogItem.name,
            itemIconUrl: catalogItem.iconUrl ?? null,
            price,
            currency,
            quantity,
            notes: notes || null,
            status: 'active',
        },
        include: {
            seller: { select: { id: true, name: true, image: true } },
        },
    })

    return NextResponse.json(
        {
            listing: {
                id: listing.id,
                sellerId: listing.sellerId,
                sellerName: listing.seller.name ?? null,
                ardbItemId: listing.ardbItemId,
                itemName: listing.itemName,
                itemIconUrl: listing.itemIconUrl ?? null,
                price: listing.price,
                currency: listing.currency,
                quantity: listing.quantity,
                status: listing.status,
                notes: listing.notes ?? null,
                createdAt: listing.createdAt.toISOString(),
                updatedAt: listing.updatedAt.toISOString(),
            },
        },
        { status: 201 }
    )
}
