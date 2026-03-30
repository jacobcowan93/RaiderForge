'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

import {
    fetchListings,
    fetchMarketplacePersistenceStatus,
    type ListingRow,
    type ListingsError,
} from '@/lib/marketplace/listings-api'
import { MARKETPLACE_PERSISTENCE_UNAVAILABLE } from '@/lib/marketplace/messages'

import type { ListingStatus, MarketplaceTabId } from './_lib/marketplace-types'
import { btnPrimary, MY_LISTINGS_LIMIT } from './_lib/marketplace-constants'
import { MarketplaceBuyTab } from './_components/MarketplaceBuyTab'
import { MarketplaceFooterCredits } from './_components/MarketplaceFooterCredits'
import { MarketplaceHeader } from './_components/MarketplaceHeader'
import { MarketplaceMyListingsTab } from './_components/MarketplaceMyListingsTab'
import { MarketplacePersistenceBanner } from './_components/MarketplacePersistenceBanner'
import { MarketplaceSellTab } from './_components/MarketplaceSellTab'
import { Divider, Spinner } from './_components/MarketplaceShared'

const TABS: { id: MarketplaceTabId; label: string }[] = [
    { id: 'buy', label: 'Browse Listings' },
    { id: 'sell', label: 'Sell / List Item' },
]

function MarketplaceAuthenticatedSell({
    userId,
    persistenceEnabled,
}: {
    userId: string
    persistenceEnabled: boolean
}) {
    const [myListings, setMyListings] = useState<ListingRow[]>([])
    const [loadingMyListings, setLoadingMyListings] = useState(false)
    const [myListingsError, setMyListingsError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        if (!persistenceEnabled) {
            setLoadingMyListings(false)
            setMyListings([])
            setMyListingsError(MARKETPLACE_PERSISTENCE_UNAVAILABLE)
            return () => {
                cancelled = true
            }
        }
        ;(async () => {
            setLoadingMyListings(true)
            setMyListingsError(null)
            const r = await fetchListings({ sellerId: userId, status: 'all', limit: MY_LISTINGS_LIMIT })
            if (cancelled) return
            if (!r.ok) setMyListingsError((r as ListingsError).message ?? (r as ListingsError).error)
            else setMyListings(r.listings)
            setLoadingMyListings(false)
        })()
        return () => {
            cancelled = true
        }
    }, [userId, persistenceEnabled])

    function handleDelete(id: string) {
        setMyListings((prev) => prev.filter((l) => l.id !== id))
    }

    function handleStatusChange(id: string, status: ListingStatus) {
        setMyListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    }

    function handleListingPosted(listing: ListingRow) {
        setMyListings((prev) => [listing, ...prev])
    }

    return (
        <div className="space-y-6">
            <MarketplaceMyListingsTab
                listings={myListings}
                loading={loadingMyListings}
                error={myListingsError}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
            />

            <Divider label="Create Listing" />

            <MarketplaceSellTab
                userId={userId}
                onListingPosted={handleListingPosted}
                persistenceDisabled={!persistenceEnabled}
            />
        </div>
    )
}

export default function MarketplacePage() {
    const [tab, setTab] = useState<MarketplaceTabId>('buy')
    const [persistence, setPersistence] = useState<'unknown' | 'on' | 'off'>('unknown')
    const { data: session, status: sessionStatus } = useSession()
    const userId = (session?.user as { id?: string } | undefined)?.id

    useEffect(() => {
        let cancelled = false
        void (async () => {
            const r = await fetchMarketplacePersistenceStatus()
            if (cancelled) return
            if (!r.ok || !r.listingsEnabled) setPersistence('off')
            else setPersistence('on')
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const persistenceEnabled = persistence === 'on'

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-5 pt-8 md:pt-10">
                <MarketplaceHeader />

                {persistence === 'off' ? (
                    <div className="mt-4">
                        <MarketplacePersistenceBanner />
                    </div>
                ) : null}

                {/* Tabs */}
                <div className="mt-6 flex border-b border-white/[0.15]">
                    {TABS.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setTab(id)}
                            className={`relative px-8 py-4 text-sm font-semibold transition-colors ${
                                tab === id
                                    ? 'text-white'
                                    : 'text-white/50 hover:text-white/80'
                            }`}
                        >
                            {label}
                            {tab === id && (
                                <span className="absolute bottom-0 inset-x-0 h-[2px] bg-yellow-400 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="mt-8">
                    {tab === 'buy' && <MarketplaceBuyTab onGoToSell={() => setTab('sell')} />}

                    {tab === 'sell' &&
                        (sessionStatus === 'loading' ? (
                            <div className="flex items-center justify-center py-20 gap-2.5 text-rf-textSoft/60">
                                <Spinner size={20} />
                                <span className="text-sm">Loading…</span>
                            </div>
                        ) : !userId ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4 text-rf-textSoft/60">
                                <svg
                                    viewBox="0 0 24 24"
                                    width="40"
                                    height="40"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.2"
                                    aria-hidden
                                >
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                                </svg>
                                <p className="text-sm font-medium text-rf-textSoft">Sign in to post listings</p>
                                <p className="text-xs text-center max-w-xs text-rf-textSoft/50">
                                    Create a RaiderForge account to list ARC Raiders items for sale.
                                </p>
                                <a href="/auth/signin" className={btnPrimary}>
                                    Sign in
                                </a>
                            </div>
                        ) : persistence === 'unknown' ? (
                            <div className="flex items-center justify-center py-20 gap-2.5 text-rf-textSoft/60">
                                <Spinner size={20} />
                                <span className="text-sm">Checking marketplace…</span>
                            </div>
                        ) : (
                            <MarketplaceAuthenticatedSell
                                userId={userId}
                                persistenceEnabled={persistenceEnabled}
                            />
                        ))}
                </div>

                <MarketplaceFooterCredits />
            </div>
        </div>
    )
}
