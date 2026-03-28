'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'
import {
    catalogItemToRef,
    LOADOUT_SLOTS,
    type LoadoutItemRef,
    type LoadoutSlotId,
} from '@/lib/loadouts/loadoutTypes'
import { loadLoadoutFromStorage, saveLoadoutToStorage } from '@/lib/loadouts/loadoutStorage'

import { LoadoutGearBrowser } from './_components/LoadoutGearBrowser'
import { LoadoutSlotsPanel } from './_components/LoadoutSlotsPanel'
import { LoadoutSummaryPanel } from './_components/LoadoutSummaryPanel'

type CatalogResponse = {
    syncedAt: string | null
    count: number
    attribution: typeof ARDB_CATALOG_ATTRIBUTION
    items: MarketplaceCatalogItem[]
}

function firstEmptySlot(slots: Partial<Record<LoadoutSlotId, LoadoutItemRef>>): LoadoutSlotId | null {
    for (const { id } of LOADOUT_SLOTS) {
        if (!slots[id]) return id
    }
    return null
}

export default function LoadoutsPage() {
    const [catalogItems, setCatalogItems] = useState<MarketplaceCatalogItem[]>([])
    const [catalogLoading, setCatalogLoading] = useState(true)
    const [catalogError, setCatalogError] = useState<string | null>(null)

    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('__all__')

    const [slots, setSlots] = useState<Partial<Record<LoadoutSlotId, LoadoutItemRef>>>({})
    const [selectedSlotId, setSelectedSlotId] = useState<LoadoutSlotId | null>(null)
    const [loadoutName, setLoadoutName] = useState('My loadout')
    const [hint, setHint] = useState<string | null>(null)
    const [justSaved, setJustSaved] = useState(false)
    const saveTimerRef = useRef<number | null>(null)
    const hintTimerRef = useRef<number | null>(null)

    useEffect(() => {
        const saved = loadLoadoutFromStorage()
        if (saved) {
            setLoadoutName(saved.name || 'My loadout')
            setSlots(saved.slots ?? {})
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            setCatalogLoading(true)
            setCatalogError(null)
            try {
                const res = await fetch('/api/marketplace/catalog', { cache: 'no-store' })
                if (!res.ok) throw new Error(`Catalog request failed (${res.status})`)
                const data = (await res.json()) as CatalogResponse
                if (!cancelled && Array.isArray(data.items)) setCatalogItems(data.items)
            } catch (e) {
                if (!cancelled) setCatalogError(e instanceof Error ? e.message : 'Failed to load catalog')
            } finally {
                if (!cancelled) setCatalogLoading(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [])

    const showHint = useCallback((msg: string) => {
        setHint(msg)
        if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
        hintTimerRef.current = window.setTimeout(() => setHint(null), 3200)
    }, [])

    const assignToSlot = useCallback(
        (slotId: LoadoutSlotId, ref: LoadoutItemRef) => {
            setSlots((prev) => ({ ...prev, [slotId]: ref }))
            setSelectedSlotId(slotId)
        },
        []
    )

    const handleItemActivate = useCallback(
        (item: MarketplaceCatalogItem) => {
            const ref = catalogItemToRef(item)
            setSlots((prev) => {
                if (selectedSlotId) {
                    return { ...prev, [selectedSlotId]: ref }
                }
                const empty = firstEmptySlot(prev)
                if (empty) {
                    queueMicrotask(() => setSelectedSlotId(empty))
                    return { ...prev, [empty]: ref }
                }
                queueMicrotask(() =>
                    showHint('All slots are full — pick a slot to replace, then click an item.')
                )
                return prev
            })
        },
        [selectedSlotId, showHint]
    )

    const handleAssignFromDrop = useCallback(
        (slotId: LoadoutSlotId, ref: LoadoutItemRef) => {
            assignToSlot(slotId, ref)
        },
        [assignToSlot]
    )

    const handleClearSlot = useCallback((slotId: LoadoutSlotId) => {
        setSlots((prev) => {
            const next = { ...prev }
            delete next[slotId]
            return next
        })
    }, [])

    const handleClearAll = useCallback(() => {
        setSlots({})
        setSelectedSlotId(null)
    }, [])

    const handleSave = useCallback(() => {
        saveLoadoutToStorage({
            v: 1,
            name: loadoutName.trim() || 'Untitled loadout',
            slots,
        })
        setJustSaved(true)
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = window.setTimeout(() => setJustSaved(false), 2400)
    }, [loadoutName, slots])

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
            if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
        }
    }, [])

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
                <header className="rf-card rounded-xl px-4 py-4 sm:px-5 border border-white/[0.06] border-l-2 border-l-rf-red/70">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Loadout <span className="text-rf-red">Builder</span>
                        </h1>
                        <PageMaturityBadge level="beta" />
                    </div>
                    <p className="mt-2 text-xs text-rf-textSoft max-w-2xl leading-relaxed">
                        Build and save your raid loadouts • Synergy with live events coming soon
                    </p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-5 items-start">
                    <div className="xl:col-span-4 order-2 xl:order-1 min-w-0">
                        <LoadoutGearBrowser
                            items={catalogItems}
                            loading={catalogLoading}
                            error={catalogError}
                            search={search}
                            typeFilter={typeFilter}
                            onSearchChange={setSearch}
                            onTypeFilterChange={setTypeFilter}
                            onItemActivate={handleItemActivate}
                        />
                    </div>
                    <div className="xl:col-span-5 order-1 xl:order-2 min-w-0">
                        <LoadoutSlotsPanel
                            slots={slots}
                            selectedSlotId={selectedSlotId}
                            onSelectSlot={setSelectedSlotId}
                            onAssign={handleAssignFromDrop}
                            onClearSlot={handleClearSlot}
                            hint={hint}
                        />
                    </div>
                    <div className="xl:col-span-3 order-3 min-w-0">
                        <LoadoutSummaryPanel
                            loadoutName={loadoutName}
                            onNameChange={setLoadoutName}
                            slots={slots}
                            onSave={handleSave}
                            onClearAll={handleClearAll}
                            justSaved={justSaved}
                        />
                    </div>
                </div>

                <footer className="pt-4 pb-2 border-t border-white/[0.05]">
                    <p className="text-center text-[11px] text-white/60 max-w-xl mx-auto leading-relaxed">
                        Loadout gear sourced from{' '}
                        <Link href={ARDB_CATALOG_ATTRIBUTION.providerUrl} className="text-rf-red/90 hover:underline">
                            ardb.app
                        </Link>
                        {' '}
                        via RaiderForge catalog sync. Stats and event synergy are planned.
                    </p>
                </footer>
            </div>
        </div>
    )
}
