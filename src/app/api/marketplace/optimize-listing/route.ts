import { NextRequest, NextResponse } from 'next/server'

import { generateOptimizedListing } from '@/lib/marketplace/listing-optimizer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(status: number, error: string, message: string) {
    return NextResponse.json({ error, message }, { status })
}

export async function POST(req: NextRequest) {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return jsonError(400, 'validation_error', 'Request body must be JSON.')
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return jsonError(400, 'validation_error', 'Body must be a JSON object.')
    }

    const b = body as Record<string, unknown>
    const itemRaw = b.item
    if (!itemRaw || typeof itemRaw !== 'object' || Array.isArray(itemRaw)) {
        return jsonError(400, 'validation_error', 'item is required.')
    }

    const item = itemRaw as Record<string, unknown>
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    if (!name) {
        return jsonError(400, 'validation_error', 'item.name is required.')
    }

    const foundIn = Array.isArray(item.foundIn)
        ? item.foundIn.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        : []

    const priceRaw = b.price
    const price =
        typeof priceRaw === 'number'
            ? priceRaw
            : typeof priceRaw === 'string' && priceRaw.trim()
              ? parseFloat(priceRaw)
              : null

    try {
        const result = await generateOptimizedListing({
            item: {
                name,
                itemType: typeof item.itemType === 'string' ? item.itemType.trim() || null : null,
                rarity: typeof item.rarity === 'string' ? item.rarity.trim() || null : null,
                description: typeof item.description === 'string' ? item.description.trim() || null : null,
                foundIn,
            },
            price: Number.isFinite(price) ? price : null,
            currency: typeof b.currency === 'string' ? b.currency.trim() || null : null,
            quantity: typeof b.quantity === 'number' ? b.quantity : null,
            notes: typeof b.notes === 'string' ? b.notes.trim() || null : null,
        })

        return NextResponse.json(result)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to optimize listing right now.'
        const status = message.includes('OPENAI_API_KEY') ? 503 : 502
        return jsonError(status, 'optimizer_unavailable', message)
    }
}
