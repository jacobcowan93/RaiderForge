'use client'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'
import { catalogItemToRef, LOADOUT_DRAG_MIME, type LoadoutItemRef } from '@/lib/loadouts/loadoutTypes'
import Link from 'next/link'

import { inputCls, selectCls } from '../_lib/loadout-ui'
import { TypeBadge } from '@/app/(site)/marketplace/_components/MarketplaceShared'
import { formatRarityLabel } from '@/lib/blueprints/rarityCardStyles'

function uniqueItemTypes(items: MarketplaceCatalogItem[]): string[] {
    const set = new Set<string>()
    for (const it of items) {
        const t = (it.itemType ?? '').trim()
        if (t) set.add(t)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
}

function dragPayload(ref: LoadoutItemRef): string {
    return JSON.stringify(ref)
}

export function LoadoutGearBrowser({
    items,
    loading,
    error,
    search,
    typeFilter,
    onSearchChange,
    onTypeFilterChange,
    onItemActivate,
}: {
    items: MarketplaceCatalogItem[]
    loading: boolean
    error: string | null
    search: string
    typeFilter: string
    onSearchChange: (v: string) => void
    onTypeFilterChange: (v: string) => void
    onItemActivate: (item: MarketplaceCatalogItem) => void
}) {
    const typeOptions = uniqueItemTypes(items)

    const filtered = (() => {
        const q = search.trim().toLowerCase()
        let list = items
        if (typeFilter !== '__all__') {
            list = list.filter((it) => (it.itemType ?? '').trim() === typeFilter)
        }
        if (q) list = list.filter((it) => it.name.toLowerCase().includes(q))
        return list
    })()

    function startDrag(e: React.DragEvent, item: MarketplaceCatalogItem) {
        const ref = catalogItemToRef(item)
        const payload = dragPayload(ref)
        e.dataTransfer.setData(LOADOUT_DRAG_MIME, payload)
        e.dataTransfer.setData('text/plain', payload)
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div className="rf-card rounded-xl border border-blue-950/35 border-l-rf-red/25 bg-[#050810]/50 flex flex-col min-h-0 max-h-[70vh] xl:max-h-[calc(100vh-12rem)]">
            <div className="px-3 py-3 sm:px-4 border-b border-white/[0.06] shrink-0">
                <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-rf-textSoft/90">Available gear</h2>
                <p className="text-[11px] text-rf-textSoft/65 mt-1 leading-relaxed">
                    Click an item or drag into a slot. Data from{' '}
                    <Link href={ARDB_CATALOG_ATTRIBUTION.providerUrl} className="text-rf-red/90 hover:underline">
                        ardb.app
                    </Link>
                    .
                </p>
            </div>

            <div className="p-3 sm:p-4 space-y-3 shrink-0">
                <div>
                    <label htmlFor="lo-search" className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5">
                        Search
                    </label>
                    <input
                        id="lo-search"
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Filter by name…"
                        className={inputCls}
                    />
                </div>
                {typeOptions.length > 0 ? (
                    <div>
                        <label htmlFor="lo-type" className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5">
                            Type
                        </label>
                        <select
                            id="lo-type"
                            value={typeFilter}
                            onChange={(e) => onTypeFilterChange(e.target.value)}
                            className={selectCls}
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

            <div className="flex-1 min-h-[12rem] overflow-y-auto px-3 sm:px-4 pb-3 border-t border-white/[0.05]">
                {loading ? (
                    <div className="animate-pulse space-y-2 pt-3" aria-busy="true">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-14 rounded-lg bg-white/[0.06] border border-white/[0.04]" />
                        ))}
                    </div>
                ) : error ? (
                    <p className="text-xs text-rf-red/85 pt-4">{error}</p>
                ) : filtered.length === 0 ? (
                    <div className="py-10 text-center text-rf-textSoft/60 text-sm">
                        <p className="font-medium text-rf-text">No gear matches</p>
                        <p className="text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                            {items.length === 0
                                ? 'Catalog not loaded yet. Refresh or try again later.'
                                : 'Adjust search or set type to “All types”.'}
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-1.5 pt-3 pb-1">
                        {filtered.map((item) => (
                            <li key={item.ardbId}>
                                <button
                                    type="button"
                                    draggable
                                    onDragStart={(e) => startDrag(e, item)}
                                    onClick={() => onItemActivate(item)}
                                    className="w-full text-left rf-card rounded-lg border border-white/[0.06] px-2.5 py-2 flex gap-2.5 items-center hover:border-rf-red/35 hover:bg-white/[0.03] transition-colors cursor-grab active:cursor-grabbing"
                                >
                                    <GearThumb snapshot={catalogItemToRef(item)} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-bold text-rf-text leading-tight line-clamp-2">
                                            {item.name}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <TypeBadge type={item.itemType} />
                                            {item.rarity?.trim() ? (
                                                <span className="text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-rf-textSoft font-bold">
                                                    {formatRarityLabel(item.rarity)}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function GearThumb({ snapshot: r }: { snapshot: LoadoutItemRef }) {
    if (!r.iconUrl) {
        return (
            <div className="h-11 w-11 shrink-0 rounded-md bg-[#0a1220] border border-white/10 flex items-center justify-center text-[8px] text-rf-textSoft/50 uppercase">
                —
            </div>
        )
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={r.iconUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-md object-contain bg-black/40 border border-white/10"
        />
    )
}
