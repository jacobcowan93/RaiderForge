import type { MarketplaceResult, MarketplaceRouteError } from '@/lib/marketplace/browse-api'
import type { ListingRow, CatalogItemSummary } from '@/lib/marketplace/listings-api'
import type { OrderRow, OrdersError } from '@/lib/marketplace/orders-api'

import type { OrderDisplayField, OrderRole, OrderStatus } from './marketplace-types'
import {
    BUYER_TRANSITIONS,
    ORDER_STATUS_LABELS,
    SELLER_TRANSITIONS,
    ORDER_TRANSITION_LABELS,
} from './marketplace-constants'

// ─── Listing helpers ──────────────────────────────────────────────────────────

export function marketplaceOrderErrorMessage(r: MarketplaceResult<unknown>): string {
    if (r.ok) return ''
    const e = r as MarketplaceRouteError
    if (e.error === 'g2g_not_configured') return `G2G not configured`
    return e.error || 'Request failed'
}

export function uniqueItemTypesFromListings(listings: ListingRow[]): string[] {
    const types = new Set<string>()
    for (const l of listings) {
        if (l.itemType) types.add(l.itemType.toLowerCase())
    }
    return Array.from(types).sort()
}

export function filterBrowseListings(
    listings: ListingRow[],
    search: string,
    typeFilter: string,
): ListingRow[] {
    let list = listings
    if (search.trim()) {
        const q = search.toLowerCase()
        list = list.filter(
            (l) =>
                l.itemName.toLowerCase().includes(q) ||
                (l.itemDescription ?? '').toLowerCase().includes(q) ||
                (l.sellerName ?? '').toLowerCase().includes(q),
        )
    }
    if (typeFilter !== 'all') {
        list = list.filter((l) => (l.itemType ?? '').toLowerCase() === typeFilter)
    }
    return list
}

const PICKER_MAX_UNFILTERED = 80
const PICKER_MAX_FILTERED = 60

export function filterCatalogItemsForPicker(items: CatalogItemSummary[], query: string): CatalogItemSummary[] {
    if (!query.trim()) return items.slice(0, PICKER_MAX_UNFILTERED)
    const lower = query.toLowerCase()
    return items
        .filter(
            (it) =>
                it.name.toLowerCase().includes(lower) || (it.itemType ?? '').toLowerCase().includes(lower),
        )
        .slice(0, PICKER_MAX_FILTERED)
}

export function parseOrderDisplayFields(payload: unknown): OrderDisplayField[] {
    if (!payload || typeof payload !== 'object') return []
    const p = payload as Record<string, unknown>
    const known: OrderDisplayField[] = []
    const add = (label: string, key: string) => {
        const v = p[key]
        if (v !== undefined && v !== null && v !== '') known.push({ label, value: String(v) })
    }
    add('Order ID', 'order_id')
    add('Status', 'status')
    add('Amount', 'amount')
    add('Currency', 'currency')
    add('Buyer ID', 'buyer_id')
    add('Seller ID', 'seller_id')
    add('Created', 'created_at')
    add('Updated', 'updated_at')
    const usedKeys = new Set([
        'order_id', 'status', 'amount', 'currency', 'buyer_id', 'seller_id', 'created_at', 'updated_at',
    ])
    for (const [k, v] of Object.entries(p)) {
        if (!usedKeys.has(k) && v !== undefined && v !== null && v !== '') {
            known.push({
                label: k.replace(/_/g, ' '),
                value: typeof v === 'object' ? JSON.stringify(v) : String(v),
            })
        }
    }
    return known
}

// ─── Order helpers ────────────────────────────────────────────────────────────

export function ordersErrorMessage(r: OrdersError): string {
    return r.message ?? r.error ?? 'Request failed'
}

/** Human-readable label for an order status string (handles unknown values gracefully). */
export function orderStatusLabel(status: string): string {
    return ORDER_STATUS_LABELS[status as OrderStatus] ?? status.replace(/_/g, ' ')
}

/** Available transitions for the caller given their role and the current order status. */
export function availableOrderTransitions(
    currentStatus: string,
    role: OrderRole,
): OrderStatus[] {
    const map = role === 'seller' ? SELLER_TRANSITIONS : BUYER_TRANSITIONS
    return (map[currentStatus as OrderStatus] ?? []) as OrderStatus[]
}

/** Button label for transitioning to a given status. */
export function orderTransitionLabel(toStatus: OrderStatus): string {
    return ORDER_TRANSITION_LABELS[toStatus] ?? orderStatusLabel(toStatus)
}

/** Role of the caller in a given order. Returns null if the userId is neither buyer nor seller. */
export function orderRole(order: OrderRow, userId: string): OrderRole | null {
    if (order.buyerId === userId) return 'buyer'
    if (order.sellerId === userId) return 'seller'
    return null
}

/** Sort orders: non-terminal first (by updatedAt desc), then terminal (by updatedAt desc). */
export function sortOrdersForDisplay(orders: OrderRow[]): OrderRow[] {
    const TERMINAL = new Set(['completed', 'cancelled', 'disputed'])
    const active = orders.filter((o) => !TERMINAL.has(o.status))
    const terminal = orders.filter((o) => TERMINAL.has(o.status))
    const byDate = (a: OrderRow, b: OrderRow) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    return [...active.sort(byDate), ...terminal.sort(byDate)]
}
