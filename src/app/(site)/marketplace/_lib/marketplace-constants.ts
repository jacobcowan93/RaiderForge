import type { MarketplaceTabId, OrderStatus } from './marketplace-types'

export const inputCls =
    'w-full px-3 py-2.5 bg-black/50 border border-rf-border rounded-lg text-sm text-rf-text ' +
    'placeholder:text-rf-textSoft/40 focus-visible:border-rf-blue/45 focus-visible:ring-2 ' +
    'focus-visible:ring-rf-blue/[0.08] outline-none transition-colors ' +
    'disabled:opacity-40 disabled:cursor-not-allowed'

export const selectCls = `${inputCls} cursor-pointer`

export const btnPrimary =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ' +
    'bg-rf-orange text-black hover:bg-amber-400 active:scale-[0.97] ' +
    'transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'

export const btnGhost =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ' +
    'bg-transparent border border-rf-border text-rf-textSoft hover:text-rf-text hover:border-white/20 ' +
    'active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

export const btnDanger =
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ' +
    'bg-rf-red/10 border border-rf-red/25 text-rf-red/80 hover:bg-rf-red/20 hover:text-rf-red ' +
    'active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

export const btnGreen =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ' +
    'bg-rf-green/10 border border-rf-green/35 text-rf-green hover:bg-rf-green/20 ' +
    'active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed'

export const sectionHeading = 'text-[10px] uppercase tracking-[0.2em] text-rf-textSoft font-semibold'

export const MARKETPLACE_TABS: { id: MarketplaceTabId; label: string }[] = [
    { id: 'buy', label: 'Buy' },
    { id: 'sell', label: 'List an Item' },
]

export const LISTING_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD'] as const

export const TOAST_DURATION_MS = 3200

export const BROWSE_LISTINGS_LIMIT = 200
export const MY_LISTINGS_LIMIT = 200
export const MY_ORDERS_LIMIT = 100

// ─── Order status display ─────────────────────────────────────────────────────

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Pending',
    awaiting_payment: 'Awaiting Payment',
    paid: 'Paid',
    awaiting_delivery: 'Awaiting Delivery',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
}

export const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
    pending:            'bg-rf-orange/10   text-rf-orange   border-rf-orange/25',
    awaiting_payment:   'bg-yellow-500/10  text-yellow-300  border-yellow-500/25',
    paid:               'bg-rf-blue/10     text-rf-blue     border-rf-blue/25',
    awaiting_delivery:  'bg-sky-500/10     text-sky-300     border-sky-500/25',
    delivered:          'bg-rf-green/12    text-rf-green    border-rf-green/25',
    completed:          'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    cancelled:          'bg-white/[0.04]   text-rf-textSoft border-white/10',
    disputed:           'bg-rf-red/10      text-rf-red      border-rf-red/25',
}

// ─── Valid status transitions per actor role ──────────────────────────────────
// Mirrors the server-side rules in /api/marketplace/orders/[id]/route.ts.
// Used only for building action buttons — server re-validates everything.

export const BUYER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending:           ['cancelled'],
    awaiting_payment:  ['cancelled'],
    delivered:         ['completed', 'disputed'],
    paid:              ['disputed'],
    awaiting_delivery: ['disputed'],
}

export const SELLER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
    pending:           ['awaiting_payment', 'cancelled'],
    awaiting_payment:  ['paid', 'cancelled'],
    paid:              ['awaiting_delivery'],
    awaiting_delivery: ['delivered', 'cancelled'],
}

export const ORDER_TRANSITION_LABELS: Partial<Record<OrderStatus, string>> = {
    awaiting_payment: 'Request Payment',
    paid:             'Mark Paid',
    awaiting_delivery:'Start Delivery',
    delivered:        'Mark Delivered',
    completed:        'Confirm Received',
    cancelled:        'Cancel Order',
    disputed:         'Raise Dispute',
}
