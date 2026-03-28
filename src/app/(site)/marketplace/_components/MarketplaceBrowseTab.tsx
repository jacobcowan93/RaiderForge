'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'

import { inputCls } from '../_lib/marketplace-constants'
import { ErrorMsg, Spinner } from './MarketplaceShared'
import { MarketplaceEmptyState } from './MarketplaceEmptyState'
import { MarketplaceCatalogItemCard } from './MarketplaceCatalogItemCard'

type CatalogResponse = {
    syncedAt: string | null
    count: number
    attribution: typeof ARDB_CATALOG_ATTRIBUTION
    items: MarketplaceCatalogItem[]
}

function uniqueItemTypes(items: MarketplaceCatalogItem[]): string[] {
    const set = new Set<string>()
    for (const it of items) {
        const t = (it.itemType ?? '').trim()
        if (t) set.add(t)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
}

const btnReset =
    'inline-flex items-center justify-center rounded-lg border border-white/15 bg-rf-bg/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rf-text hover:border-rf-red/40 hover:bg-white/5 hover:text-white transition-colors'

export function MarketplaceBrowseTab() {
    const [items, setItems] = useState<MarketplaceCatalogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('__all__')

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch('/api/marketplace/catalog', { cache: 'no-store' })
                if (!res.ok) throw new Error(`Catalog request failed (${res.status})`)
                const data = (await res.json()) as CatalogResponse
                if (!cancelled && Array.isArray(data.items)) setItems(data.items)
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load catalog')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const typeOptions = useMemo(() => uniqueItemTypes(items), [items])

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        let list = items
        if (typeFilter !== '__all__') {
            list = list.filter((it) => (it.itemType ?? '').trim() === typeFilter)
        }
        if (q) list = list.filter((it) => it.name.toLowerCase().includes(q))
        return list
    }, [items, search, typeFilter])

    return (
        <div className="space-y-4 md:space-y-5">
            <div className="rf-card rounded-lg border border-blue-950/35 border-l-rf-red/25 bg-[#050810]/40 px-3 py-3 sm:px-4">
                <p className="text-[11px] text-rf-textSoft/90 leading-relaxed">
                    Item data powered by{' '}
                    <Link
                        href={ARDB_CATALOG_ATTRIBUTION.providerUrl}
                        className="text-rf-red/90 hover:underline font-medium"
                    >
                        ardb.app
                    </Link>
                    . Live trading via G2G is coming soon — browse only for now.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:justify-between">
                <div className="flex-1 min-w-0">
                    <label htmlFor="mp-catalog-search" className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5">
                        Search
                    </label>
                    <div className="relative">
                        <svg
                            viewBox="0 0 16 16"
                            width="14"
                            height="14"
                            fill="currentColor"
                            aria-hidden
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-rf-textSoft/40 pointer-events-none"
                        >
                            <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
                        </svg>
                        <input
                            id="mp-catalog-search"
                            type="search"
                            className={`${inputCls} pl-9 focus-visible:border-rf-red/40 focus-visible:ring-2 focus-visible:ring-rf-red/[0.12]`}
                            placeholder="Filter by item name…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                {typeOptions.length > 0 ? (
                    <div className="sm:w-56">
                        <label htmlFor="mp-catalog-type" className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5">
                            Type
                        </label>
                        <select
                            id="mp-catalog-type"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className={`${inputCls} cursor-pointer focus-visible:border-rf-red/40 focus-visible:ring-2 focus-visible:ring-rf-red/[0.12]`}
                        >
                            <option value="__all__">All types</option>
                            {typeOptions.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 gap-2.5 text-rf-textSoft">
                    <Spinner size={20} />
                    <span className="text-sm">Loading catalog…</span>
                </div>
            ) : error ? (
                <div className="rf-card rounded-xl px-6 py-10 text-center border border-rf-red/25">
                    <ErrorMsg msg={error} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rf-card rounded-xl px-6 py-10 text-center border border-white/[0.06]">
                    <MarketplaceEmptyState
                        title="No items match your filters"
                        description={
                            search || typeFilter !== '__all__'
                                ? 'Try a different search or set type to “All types”.'
                                : 'The catalog is empty. Check back after the next server sync.'
                        }
                    />
                    {(search || typeFilter !== '__all__') && (
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                className={btnReset}
                                onClick={() => {
                                    setSearch('')
                                    setTypeFilter('__all__')
                                }}
                            >
                                Reset filters
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <p className="text-xs text-rf-textSoft/80">
                        Showing <strong className="text-rf-text">{filtered.length}</strong> of{' '}
                        <strong className="text-rf-text">{items.length}</strong> items
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-3.5 justify-items-stretch">
                        {filtered.map((it) => (
                            <MarketplaceCatalogItemCard key={it.ardbId} item={it} />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
