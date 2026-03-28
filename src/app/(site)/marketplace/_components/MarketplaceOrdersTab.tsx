'use client'

import { useCallback, useEffect, useState } from 'react'

import { fetchOrders, type OrderRow, type OrdersError } from '@/lib/marketplace/orders-api'

import { MY_ORDERS_LIMIT } from '../_lib/marketplace-constants'
import { sortOrdersForDisplay } from '../_lib/marketplace-view-models'
import { ErrorMsg, Spinner } from './MarketplaceShared'
import { MarketplaceOrderCard } from './MarketplaceOrderCard'
import { MarketplaceEmptyState } from './MarketplaceEmptyState'

type RoleFilter = 'buyer' | 'seller'

export function MarketplaceOrdersTab({ userId }: { userId: string }) {
    const [roleFilter, setRoleFilter] = useState<RoleFilter>('buyer')
    const [orders, setOrders] = useState<OrderRow[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async (role: RoleFilter) => {
        setLoading(true)
        setError(null)
        const r = await fetchOrders({ role, limit: MY_ORDERS_LIMIT })
        setLoading(false)
        if (!r.ok) {
            const e = r as OrdersError
            setError(e.message ?? e.error ?? 'Failed to load orders')
            return
        }
        setOrders(sortOrdersForDisplay(r.orders))
    }, [])

    useEffect(() => {
        void load(roleFilter)
    }, [roleFilter, load])

    function handleStatusUpdated(orderId: string, newStatus: string) {
        setOrders((prev) =>
            sortOrdersForDisplay(
                prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
            )
        )
    }

    return (
        <div className="space-y-5">
            {/* Role toggle */}
            <div className="flex gap-1 p-1 bg-black/30 rounded-lg border border-white/[0.06] w-fit">
                {(['buyer', 'seller'] as RoleFilter[]).map((r) => (
                    <button
                        key={r}
                        type="button"
                        onClick={() => setRoleFilter(r)}
                        className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                            roleFilter === r
                                ? 'bg-rf-bgSoft text-rf-text border border-white/[0.1] shadow-sm'
                                : 'text-rf-textSoft/60 hover:text-rf-textSoft'
                        }`}
                    >
                        {r === 'buyer' ? 'Buying' : 'Selling'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 gap-2.5 text-rf-textSoft">
                    <Spinner size={20} />
                    <span className="text-sm">Loading orders…</span>
                </div>
            ) : error ? (
                <div className="py-8">
                    <ErrorMsg msg={error} />
                </div>
            ) : orders.length === 0 ? (
                <MarketplaceEmptyState
                    title={roleFilter === 'buyer' ? 'No purchases yet' : 'No incoming orders'}
                    description={
                        roleFilter === 'buyer'
                            ? 'Browse listings and place your first order.'
                            : 'Once buyers place orders for your listings they will appear here.'
                    }
                />
            ) : (
                <div className="space-y-3">
                    {orders.map((o) => (
                        <MarketplaceOrderCard
                            key={o.id}
                            order={o}
                            userId={userId}
                            onStatusUpdated={handleStatusUpdated}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
