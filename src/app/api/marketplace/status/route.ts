import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Lightweight capability probe for the client — no internal details.
 * When false, listings/orders API routes return 503 with a safe user message.
 */
export async function GET() {
    const prisma = getPrisma()
    const enabled = Boolean(prisma)
    return NextResponse.json({
        listingsEnabled: enabled,
        ordersEnabled: enabled,
    })
}
