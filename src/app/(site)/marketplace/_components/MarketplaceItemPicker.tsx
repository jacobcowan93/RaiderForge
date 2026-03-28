'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { CatalogItemSummary } from '@/lib/marketplace/listings-api'

import { inputCls } from '../_lib/marketplace-constants'
import { filterCatalogItemsForPicker } from '../_lib/marketplace-view-models'
import { ItemIcon, RarityBadge, TypeBadge } from './MarketplaceShared'

export function MarketplaceItemPicker({
    items,
    value,
    onChange,
    disabled,
}: {
    items: CatalogItemSummary[]
    value: CatalogItemSummary | null
    onChange: (item: CatalogItemSummary | null) => void
    disabled?: boolean
}) {
    const [q, setQ] = useState('')
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const results = useMemo(() => filterCatalogItemsForPicker(items, q), [q, items])

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    function selectItem(item: CatalogItemSummary) {
        onChange(item)
        setQ('')
        setOpen(false)
    }

    function clearItem() {
        onChange(null)
        setQ('')
    }

    if (value) {
        return (
            <div className="flex gap-3 items-center p-3 bg-black/40 border border-rf-border rounded-lg">
                <ItemIcon url={value.iconUrl} name={value.name} size={40} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-rf-text truncate">{value.name}</p>
                    <div className="flex gap-1.5 mt-0.5 flex-wrap">
                        <TypeBadge type={value.itemType} />
                        <RarityBadge rarity={value.rarity} />
                    </div>
                    {value.description && (
                        <p className="text-[10px] text-rf-textSoft/60 mt-1 line-clamp-2">{value.description}</p>
                    )}
                </div>
                <button
                    onClick={clearItem}
                    disabled={disabled}
                    className="shrink-0 p-1.5 rounded-md text-rf-textSoft/50 hover:text-rf-textSoft hover:bg-white/[0.06] transition-colors"
                    title="Change item"
                >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden>
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                </button>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="relative">
            <input
                className={inputCls}
                placeholder="Search items by name or type…"
                value={q}
                onChange={(e) => {
                    setQ(e.target.value)
                    setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                disabled={disabled}
            />
            {open && results.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-white/[0.12] bg-[#0b0f19] shadow-2xl shadow-black/60">
                    {results.map((item) => (
                        <button
                            key={item.ardbId}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectItem(item)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.05] transition-colors border-b border-white/[0.04] last:border-0"
                        >
                            <ItemIcon url={item.iconUrl} name={item.name} size={28} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-rf-text font-medium truncate">{item.name}</p>
                                {item.itemType && (
                                    <p className="text-[9px] uppercase tracking-wide text-rf-textSoft/60 mt-0.5">{item.itemType}</p>
                                )}
                            </div>
                            {item.rarity && (
                                <RarityBadge rarity={item.rarity} />
                            )}
                        </button>
                    ))}
                </div>
            )}
            {open && q.trim() && results.length === 0 && (
                <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-white/[0.08] bg-[#0b0f19] px-4 py-3 text-sm text-rf-textSoft/60 shadow-xl shadow-black/40">
                    No items match &ldquo;{q}&rdquo;
                </div>
            )}
        </div>
    )
}
