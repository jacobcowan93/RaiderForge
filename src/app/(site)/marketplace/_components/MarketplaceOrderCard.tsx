'use client'

import { useState } from 'react'

import { updateOrderStatus, type OrderRow, type OrdersError } from '@/lib/marketplace/orders-api'

import { btnDanger, btnGhost, btnGreen, btnPrimary, inputCls, sectionHeading } from '../_lib/marketplace-constants'
import {
    availableOrderTransitions,
    orderRole,
    orderStatusLabel,
    orderTransitionLabel,
} from '../_lib/marketplace-view-models'
import { formatListingPrice } from '../_lib/marketplace-formatters'
import { formatOrderDate, formatOrderDateTime } from '../_lib/marketplace-formatters'
import type { OrderRole, OrderStatus } from '../_lib/marketplace-types'
import { ErrorMsg, ItemIcon, OrderStatusBadge, Spinner } from './MarketplaceShared'

function TransitionButton({
    toStatus,
    onTransition,
    disabled,
}: {
    toStatus: OrderStatus
    onTransition: (status: OrderStatus, note?: string) => Promise<void>
    disabled: boolean
}) {
    const [loading, setLoading] = useState(false)

    async function handle() {
        setLoading(true)
        await onTransition(toStatus)
        setLoading(false)
    }

    const label = orderTransitionLabel(toStatus)
    const isDanger = toStatus === 'cancelled' || toStatus === 'disputed'
    const isSuccess = toStatus === 'completed' || toStatus === 'delivered' || toStatus === 'paid' || toStatus === 'awaiting_delivery'

    const cls = isDanger ? btnDanger + ' text-xs py-1.5 px-2.5'
        : isSuccess ? btnGreen + ' text-xs py-1.5 px-2.5'
        : btnGhost + ' text-xs py-1.5 px-2.5'

    return (
        <button className={cls} onClick={handle} disabled={disabled || loading}>
            {loading ? <Spinner size={11} /> : label}
        </button>
    )
}

function OrderTimeline({ events }: { events: OrderRow['events'] }) {
    if (events.length === 0) return null
    return (
        <div className="space-y-2">
            {events.map((e) => (
                <div key={e.id} className="flex gap-2.5 items-start text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-rf-blue/60 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <span className="text-rf-textSoft/70">
                            {e.fromStatus
                                ? `${orderStatusLabel(e.fromStatus)} → `
                                : ''}
                            <strong className="text-rf-text font-semibold">
                                {orderStatusLabel(e.toStatus)}
                            </strong>
                        </span>
                        {e.note && <p className="text-rf-textSoft/50 mt-0.5 line-clamp-2">{e.note}</p>}
                    </div>
                    <span className="text-[9px] text-rf-textSoft/35 shrink-0 mt-0.5">
                        {formatOrderDateTime(e.createdAt)}
                    </span>
                </div>
            ))}
        </div>
    )
}

export function MarketplaceOrderCard({
    order,
    userId,
    onStatusUpdated,
}: {
    order: OrderRow
    userId: string
    onStatusUpdated: (orderId: string, newStatus: string) => void
}) {
    const [expanded, setExpanded] = useState(false)
    const [transitioning, setTransitioning] = useState(false)
    const [transitionError, setTransitionError] = useState<string | null>(null)

    const role: OrderRole | null = orderRole(order, userId)
    if (!role) return null

    const transitions = availableOrderTransitions(order.status, role)
    const totalStr = formatListingPrice(order.totalAmount, order.currency)
    const unitStr = formatListingPrice(order.unitPrice, order.currency)
    const createdStr = formatOrderDate(order.createdAt)

    async function handleTransition(toStatus: OrderStatus) {
        setTransitioning(true)
        setTransitionError(null)
        const r = await updateOrderStatus(order.id, { status: toStatus })
        setTransitioning(false)
        if (!r.ok) {
            const e = r as OrdersError
            setTransitionError(e.message ?? e.error ?? 'Update failed')
            return
        }
        onStatusUpdated(order.id, toStatus)
    }

    const counterpartyLabel = role === 'buyer' ? 'Seller' : 'Buyer'
    const counterpartyName = role === 'buyer'
        ? (order.sellerName ?? 'Anonymous')
        : (order.buyerName ?? 'Anonymous')

    return (
        <div className="rf-card rounded-xl border border-white/[0.08] overflow-hidden transition-all duration-200 hover:border-white/[0.14]">
            {/* Header row */}
            <div className="flex gap-3 items-center p-3.5">
                <ItemIcon url={order.itemIconUrl} name={order.itemName} size={40} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-rf-text truncate">{order.itemName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-[10px] text-rf-textSoft/50">
                            {totalStr}{order.quantity > 1 ? ` · Qty ${order.quantity}` : ''}
                        </span>
                        <span className="text-[10px] text-rf-textSoft/35">{createdStr}</span>
                    </div>
                </div>

                {/* Action buttons */}
                {transitions.length > 0 && (
                    <div className="flex gap-1.5 shrink-0">
                        {transitions.map((t) => (
                            <TransitionButton
                                key={t}
                                toStatus={t as OrderStatus}
                                onTransition={handleTransition}
                                disabled={transitioning}
                            />
                        ))}
                    </div>
                )}

                {/* Expand toggle */}
                <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="shrink-0 p-1.5 rounded-md text-rf-textSoft/40 hover:text-rf-textSoft hover:bg-white/[0.05] transition-colors"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                    <svg
                        viewBox="0 0 16 16"
                        width="13"
                        height="13"
                        fill="currentColor"
                        className={`transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
                        aria-hidden
                    >
                        <path d="M4.427 6.427a.75.75 0 0 1 1.06 0L8 8.94l2.513-2.513a.75.75 0 1 1 1.06 1.06l-3.043 3.043a.75.75 0 0 1-1.06 0L4.427 7.487a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                </button>
            </div>

            {transitionError && (
                <div className="px-3.5 pb-3">
                    <ErrorMsg msg={transitionError} />
                </div>
            )}

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-white/[0.06] px-3.5 py-3 space-y-3">
                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                            <p className={sectionHeading}>Order ID</p>
                            <p className="text-[10px] font-mono text-rf-textSoft/70 mt-0.5 break-all">{order.id}</p>
                        </div>
                        <div>
                            <p className={sectionHeading}>{counterpartyLabel}</p>
                            <p className="text-xs text-rf-textSoft mt-0.5 font-medium">{counterpartyName}</p>
                        </div>
                        <div>
                            <p className={sectionHeading}>Unit Price</p>
                            <p className="text-xs text-rf-text mt-0.5 font-medium">{unitStr}</p>
                        </div>
                        <div>
                            <p className={sectionHeading}>Role</p>
                            <p className="text-xs text-rf-text mt-0.5 font-medium capitalize">{role}</p>
                        </div>
                    </div>

                    {/* Notes */}
                    {(order.buyerNote || order.sellerNote) && (
                        <div className="space-y-1.5">
                            {order.buyerNote && (
                                <div className="bg-black/20 rounded-md px-2.5 py-2">
                                    <p className={sectionHeading + ' mb-1'}>Buyer note</p>
                                    <p className="text-xs text-rf-textSoft/70">{order.buyerNote}</p>
                                </div>
                            )}
                            {order.sellerNote && (
                                <div className="bg-black/20 rounded-md px-2.5 py-2">
                                    <p className={sectionHeading + ' mb-1'}>Seller note</p>
                                    <p className="text-xs text-rf-textSoft/70">{order.sellerNote}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Timeline */}
                    {order.events.length > 0 && (
                        <div>
                            <p className={sectionHeading + ' mb-2'}>Timeline</p>
                            <OrderTimeline events={order.events} />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
