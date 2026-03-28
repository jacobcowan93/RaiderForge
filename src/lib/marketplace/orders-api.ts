/**
 * Browser-side fetch helpers for RaiderForge native order management.
 * All price/availability validation happens server-side.
 */

const BASE = '/api/marketplace/orders'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus =
    | 'pending'
    | 'awaiting_payment'
    | 'paid'
    | 'awaiting_delivery'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'disputed'

export type OrderEvent = {
    id: string
    actorId: string | null
    fromStatus: string | null
    toStatus: string
    note: string | null
    createdAt: string
}

export type OrderRow = {
    id: string
    listingId: string
    buyerId: string
    buyerName: string | null
    buyerImage: string | null
    sellerId: string
    sellerName: string | null
    sellerImage: string | null
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
    createdAt: string
    updatedAt: string
    events: OrderEvent[]
}

export type OrdersError = { ok: false; error: string; message?: string; status?: number }

async function parseError(res: Response): Promise<OrdersError> {
    let json: unknown
    try { json = await res.json() } catch { /* ignore */ }
    const e = json as { error?: string; message?: string } | undefined
    return { ok: false, error: e?.error ?? 'request_failed', message: e?.message, status: res.status }
}

// ─── Fetch orders list ────────────────────────────────────────────────────────

export type FetchOrdersOpts = {
    role?: 'buyer' | 'seller'
    status?: string
    limit?: number
}

export type FetchOrdersResult = { ok: true; orders: OrderRow[] } | OrdersError

export async function fetchOrders(opts?: FetchOrdersOpts): Promise<FetchOrdersResult> {
    const qs = new URLSearchParams()
    if (opts?.role) qs.set('role', opts.role)
    if (opts?.status) qs.set('status', opts.status)
    if (opts?.limit !== undefined) qs.set('limit', String(opts.limit))
    const q = qs.toString()
    const res = await fetch(`${BASE}${q ? `?${q}` : ''}`)
    if (!res.ok) return parseError(res)
    const json = await res.json() as { orders?: OrderRow[] }
    return { ok: true, orders: json.orders ?? [] }
}

// ─── Fetch single order ───────────────────────────────────────────────────────

export type FetchOrderResult = { ok: true; order: OrderRow } | OrdersError

export async function fetchOrder(id: string): Promise<FetchOrderResult> {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`)
    if (!res.ok) return parseError(res)
    const json = await res.json() as { order: OrderRow }
    return { ok: true, order: json.order }
}

// ─── Create order (buyer) ─────────────────────────────────────────────────────

export type CreateOrderBody = {
    listingId: string
    quantity?: number
    buyerNote?: string
}

export type CreateOrderResult = { ok: true; order: OrderRow } | OrdersError

export async function createOrder(body: CreateOrderBody): Promise<CreateOrderResult> {
    const res = await fetch(BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) return parseError(res)
    const json = await res.json() as { order: OrderRow }
    return { ok: true, order: json.order }
}

// ─── Update order status ──────────────────────────────────────────────────────

export type UpdateOrderBody = {
    status: OrderStatus
    note?: string
}

export type UpdateOrderResult = { ok: true; order: Omit<OrderRow, 'events'> } | OrdersError

export async function updateOrderStatus(id: string, body: UpdateOrderBody): Promise<UpdateOrderResult> {
    const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) return parseError(res)
    const json = await res.json() as { order: Omit<OrderRow, 'events'> }
    return { ok: true, order: json.order }
}
