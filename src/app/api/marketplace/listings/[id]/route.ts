import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/options'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_STATUSES = ['active', 'sold', 'cancelled']
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD']
const MAX_NOTES_LEN = 500

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

type RouteContext = { params: Promise<{ id: string }> }

// ─── PATCH /api/marketplace/listings/[id] ────────────────────────────────────
// Auth required. Seller may update price, currency, quantity, notes, or status.

export async function PATCH(req: NextRequest, ctx: RouteContext) {
    const prisma = getPrisma()
    if (!prisma) {
        return jsonError(503, 'service_unavailable', 'Marketplace listings require DATABASE_URL.')
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) {
        return jsonError(401, 'unauthorized', 'Sign in to update a listing.')
    }

    const { id } = await ctx.params

    const existing = await prisma.marketplaceListing.findUnique({ where: { id } })
    if (!existing) return jsonError(404, 'not_found', 'Listing not found.')
    if (existing.sellerId !== userId) return jsonError(403, 'forbidden', 'You can only edit your own listings.')

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
    const data: Record<string, unknown> = {}

    if ('price' in b) {
        const price = typeof b.price === 'number' ? b.price : parseFloat(String(b.price ?? ''))
        if (!Number.isFinite(price) || price <= 0) return jsonError(400, 'validation_error', 'price must be a positive number.')
        data.price = price
    }
    if ('currency' in b) {
        const currency = typeof b.currency === 'string' ? b.currency.toUpperCase().trim() : ''
        if (!ALLOWED_CURRENCIES.includes(currency)) {
            return jsonError(400, 'validation_error', `currency must be one of: ${ALLOWED_CURRENCIES.join(', ')}.`)
        }
        data.currency = currency
    }
    if ('quantity' in b) {
        const quantity = typeof b.quantity === 'number' ? Math.max(1, Math.floor(b.quantity)) : 1
        data.quantity = quantity
    }
    if ('notes' in b) {
        data.notes = typeof b.notes === 'string' ? b.notes.trim().slice(0, MAX_NOTES_LEN) || null : null
    }
    if ('status' in b) {
        const status = typeof b.status === 'string' ? b.status.trim().toLowerCase() : ''
        if (!ALLOWED_STATUSES.includes(status)) {
            return jsonError(400, 'validation_error', `status must be one of: ${ALLOWED_STATUSES.join(', ')}.`)
        }
        data.status = status
    }

    if (Object.keys(data).length === 0) {
        return jsonError(400, 'validation_error', 'No updatable fields provided.')
    }

    const updated = await prisma.marketplaceListing.update({ where: { id }, data })

    return NextResponse.json({
        listing: {
            id: updated.id,
            sellerId: updated.sellerId,
            ardbItemId: updated.ardbItemId,
            itemName: updated.itemName,
            itemIconUrl: updated.itemIconUrl ?? null,
            price: updated.price,
            currency: updated.currency,
            quantity: updated.quantity,
            status: updated.status,
            notes: updated.notes ?? null,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
        },
    })
}

// ─── DELETE /api/marketplace/listings/[id] ───────────────────────────────────
// Auth required. Hard-deletes the listing (seller only).

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
    const prisma = getPrisma()
    if (!prisma) {
        return jsonError(503, 'service_unavailable', 'Marketplace listings require DATABASE_URL.')
    }

    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) {
        return jsonError(401, 'unauthorized', 'Sign in to delete a listing.')
    }

    const { id } = await ctx.params

    const existing = await prisma.marketplaceListing.findUnique({ where: { id } })
    if (!existing) return jsonError(404, 'not_found', 'Listing not found.')
    if (existing.sellerId !== userId) return jsonError(403, 'forbidden', 'You can only delete your own listings.')

    await prisma.marketplaceListing.delete({ where: { id } })

    return NextResponse.json({ ok: true as const })
}
