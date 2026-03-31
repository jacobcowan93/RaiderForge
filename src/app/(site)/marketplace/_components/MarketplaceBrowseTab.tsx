'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'

import { inputCls } from '../_lib/marketplace-constants'
import { ErrorMsg } from './MarketplaceShared'
import { MarketplaceEmptyState } from './MarketplaceEmptyState'
import { MarketplaceCatalogItemCard } from './MarketplaceCatalogItemCard'

/** Catalog browse: name search + item type filter (distinct ARDB `itemType`), not blueprint spreadsheet category. */

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
                    . RaiderForge listings are live now. G2G checkout and escrow are planned separately from this release.
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
                <div className="rf-card rounded-xl px-4 py-8 overflow-hidden border border-white/[0.06]" aria-busy="true">
                    <div className="animate-pulse space-y-3">
                        <div className="h-6 bg-white/10 rounded w-48" />
                        <div className="h-3 bg-white/[0.06] rounded w-full max-w-md" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-3.5 pt-3">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="rf-card rounded-lg border border-white/5 overflow-hidden flex flex-col gap-1.5 p-2"
                                >
                                    <div className="h-2.5 bg-white/[0.08] rounded w-[85%]" />
                                    <div className="h-2 bg-white/[0.05] rounded w-1/2" />
                                    <div className="aspect-[5/4] rounded-md bg-white/[0.06] border border-white/[0.04]" />
                                    <div className="h-2 bg-white/[0.06] rounded w-full" />
                                    <div className="h-7 rounded-md bg-white/[0.07] border border-white/5" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="rf-card rounded-xl px-6 py-10 text-center border border-rf-red/25">
                    <ErrorMsg msg={error} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rf-card rounded-xl px-6 py-8 text-center border border-white/[0.06] border-l-rf-red/20">
                    <MarketplaceEmptyState
                        compact
                        title={items.length === 0 ? 'Catalog empty' : 'No matches for this sweep'}
                        description={
                            items.length === 0
                                ? 'Nothing is synced on the server yet. Try again after the next catalog refresh, or reload the page.'
                                : search || typeFilter !== '__all__'
                                  ? 'Your search or type filter excluded every item. Widen the name filter, set type to “All types”, or reset to repopulate the grid from the full ARDB-backed index.'
                                  : 'Unexpected empty result set. Reload the page or try again shortly.'
                        }
                    />
                    {items.length > 0 && (search || typeFilter !== '__all__') ? (
                        <div className="mt-2 flex flex-wrap justify-center gap-2">
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
                    ) : null}
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rf-textSoft/80">
                            <span className="text-xl sm:text-2xl font-black tabular-nums text-rf-red tracking-tight mr-2 align-middle">
                                {filtered.length}
                            </span>
                            <span className="align-middle">items found</span>
                        </p>
                        {filtered.length < items.length ? (
                            <p className="text-[11px] text-rf-textSoft/55 tabular-nums font-medium">
                                {items.length} total in catalog
                            </p>
                        ) : null}
                    </div>
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
