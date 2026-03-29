'use client'

import { MARKETPLACE_PERSISTENCE_UNAVAILABLE } from '@/lib/marketplace/messages'

export function MarketplacePersistenceBanner() {
    return (
        <div
            role="status"
            className="rounded-lg border border-amber-500/35 bg-amber-500/[0.12] px-4 py-3 text-sm text-amber-50/95 leading-relaxed"
        >
            {MARKETPLACE_PERSISTENCE_UNAVAILABLE}
        </div>
    )
}
