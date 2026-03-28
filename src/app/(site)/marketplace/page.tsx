'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'
import { fetchListings, type ListingRow, type ListingsError } from '@/lib/marketplace/listings-api'

import type { ListingStatus, MarketplaceTabId } from './_lib/marketplace-types'
import { btnPrimary, MY_LISTINGS_LIMIT } from './_lib/marketplace-constants'
import { MarketplaceBrowseTab } from './_components/MarketplaceBrowseTab'
import { MarketplaceHeader } from './_components/MarketplaceHeader'
import { MarketplaceMyListingsTab } from './_components/MarketplaceMyListingsTab'
import { MarketplaceOrdersTab } from './_components/MarketplaceOrdersTab'
import { MarketplaceSellTab } from './_components/MarketplaceSellTab'
import { MarketplaceTabs } from './_components/MarketplaceTabs'
import { Divider, Spinner } from './_components/MarketplaceShared'

function MarketplaceAuthenticatedSell({ userId }: { userId: string }) {
    const [myListings, setMyListings] = useState<ListingRow[]>([])
    const [loadingMyListings, setLoadingMyListings] = useState(false)
    const [myListingsError, setMyListingsError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
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
    }, [userId])

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

            <MarketplaceSellTab userId={userId} onListingPosted={handleListingPosted} />
        </div>
    )
}

export default function MarketplacePage() {
    const [tab, setTab] = useState<MarketplaceTabId>('browse')
    const { data: session, status: sessionStatus } = useSession()
    const userId = (session?.user as { id?: string } | undefined)?.id

    return (
        <div className="relative max-w-7xl mx-auto py-8 md:py-10 px-4 sm:px-5">
            <div
                className="pointer-events-none absolute inset-x-0 -top-24 h-[28rem] -z-10"
                aria-hidden
                style={{
                    background:
                        'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(239,68,68,0.06) 0%, transparent 70%)',
                }}
            />
            <div className="space-y-4 md:space-y-5">
                <MarketplaceHeader />

                <MarketplaceTabs activeTab={tab} onTabChange={setTab} />

                <div>
                    {tab === 'browse' && <MarketplaceBrowseTab />}
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
                        ) : (
                            <MarketplaceAuthenticatedSell userId={userId} />
                        ))}
                    {tab === 'orders' &&
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
                                <p className="text-sm font-medium text-rf-textSoft">Sign in to view orders</p>
                                <p className="text-xs text-center max-w-xs text-rf-textSoft/50">
                                    Sign in to track your purchases and manage incoming orders.
                                </p>
                                <a href="/auth/signin" className={btnPrimary}>
                                    Sign in
                                </a>
                            </div>
                        ) : (
                            <MarketplaceOrdersTab userId={userId} />
                        ))}
                </div>

                <footer className="pt-6 pb-2 space-y-2 border-t border-white/[0.05] mt-6">
                    <p className="text-center text-[11px] text-white/60 max-w-xl mx-auto leading-relaxed">
                        Marketplace catalog from{' '}
                        <Link href={ARDB_CATALOG_ATTRIBUTION.providerUrl} className="text-rf-red/90 hover:underline">
                            ardb.app
                        </Link>{' '}
                        • Trading powered by G2G (planned)
                    </p>
                    <p className="text-center text-[11px] text-rf-textSoft/70 max-w-xl mx-auto leading-relaxed">
                        {ARDB_CATALOG_ATTRIBUTION.providerName} item metadata — verify in-game where it matters.{' '}
                        <Link href={ARDB_CATALOG_ATTRIBUTION.providerUrl} className="text-rf-blue hover:underline">
                            {ARDB_CATALOG_ATTRIBUTION.providerUrl.replace(/^https?:\/\//, '')}
                        </Link>
                    </p>
                </footer>
            </div>
        </div>
    )
}
