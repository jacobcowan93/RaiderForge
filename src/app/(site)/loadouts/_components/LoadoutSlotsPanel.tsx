'use client'

import { useState } from 'react'

import { LOADOUT_DRAG_MIME, LOADOUT_SLOTS, type LoadoutItemRef, type LoadoutSlotId } from '@/lib/loadouts/loadoutTypes'
import { TypeBadge } from '@/app/(site)/marketplace/_components/MarketplaceShared'
import { formatRarityLabel } from '@/lib/blueprints/rarityCardStyles'

function parseDragPayload(e: React.DragEvent): LoadoutItemRef | null {
    const raw = e.dataTransfer.getData(LOADOUT_DRAG_MIME) || e.dataTransfer.getData('text/plain')
    if (!raw?.trim()) return null
    try {
        const o = JSON.parse(raw) as LoadoutItemRef
        if (o && typeof o.ardbId === 'string' && typeof o.name === 'string') return o
    } catch {
        /* invalid */
    }
    return null
}

export function LoadoutSlotsPanel({
    slots,
    selectedSlotId,
    onSelectSlot,
    onAssign,
    onClearSlot,
    hint,
}: {
    slots: Partial<Record<LoadoutSlotId, LoadoutItemRef>>
    selectedSlotId: LoadoutSlotId | null
    onSelectSlot: (id: LoadoutSlotId) => void
    onAssign: (slotId: LoadoutSlotId, ref: LoadoutItemRef) => void
    onClearSlot: (slotId: LoadoutSlotId) => void
    hint: string | null
}) {
    return (
        <div className="rf-card rounded-xl border border-white/[0.08] border-t-rf-red/25 bg-[#060a14]/80 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06]">
                <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-rf-textSoft/90">Loadout rack</h2>
                <p className="text-[11px] text-rf-textSoft/65 mt-1">
                    Select a slot, then click gear — or drag items from the left list.
                </p>
                {hint ? (
                    <p className="text-[11px] text-amber-200/85 mt-2 font-medium" role="status">
                        {hint}
                    </p>
                ) : null}
            </div>
            <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LOADOUT_SLOTS.map((s) => (
                    <LoadoutSlotCell
                        key={s.id}
                        slot={s}
                        item={slots[s.id]}
                        selected={selectedSlotId === s.id}
                        onSelect={() => onSelectSlot(s.id)}
                        onClear={() => onClearSlot(s.id)}
                        onDropItem={(ref) => onAssign(s.id, ref)}
                    />
                ))}
            </div>
        </div>
    )
}

function LoadoutSlotCell({
    slot,
    item,
    selected,
    onSelect,
    onClear,
    onDropItem,
}: {
    slot: (typeof LOADOUT_SLOTS)[number]
    item: LoadoutItemRef | undefined
    selected: boolean
    onSelect: () => void
    onClear: () => void
    onDropItem: (ref: LoadoutItemRef) => void
}) {
    const [dragOver, setDragOver] = useState(false)

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect()
                }
            }}
            onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
                setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const ref = parseDragPayload(e)
                if (ref) onDropItem(ref)
            }}
            className={`rounded-lg border-2 min-h-[5.5rem] p-2.5 text-left transition-colors ${
                selected
                    ? 'border-rf-red/55 bg-rf-red/[0.08] ring-1 ring-rf-red/25'
                    : dragOver
                      ? 'border-rf-red/40 bg-rf-red/[0.05]'
                      : 'border-white/[0.08] bg-black/25 hover:border-white/15'
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-rf-red/90">{slot.label}</p>
                    <p className="text-[9px] text-rf-textSoft/50 mt-0.5">{slot.hint}</p>
                </div>
                {item ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onClear()
                        }}
                        className="text-[9px] font-bold uppercase tracking-wide text-rf-textSoft/60 hover:text-rf-red shrink-0"
                    >
                        Clear
                    </button>
                ) : null}
            </div>
            {item ? (
                <div className="mt-2 flex gap-2 items-center">
                    {item.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={item.iconUrl}
                            alt=""
                            className="h-10 w-10 rounded-md object-contain bg-black/40 border border-white/10 shrink-0"
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-md bg-[#0a1220] border border-white/10 shrink-0" />
                    )}
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white leading-tight line-clamp-2">{item.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            <TypeBadge type={item.itemType} />
                            {item.rarity?.trim() ? (
                                <span className="text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-rf-textSoft font-bold">
                                    {formatRarityLabel(item.rarity)}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : (
                <p className="mt-3 text-[10px] text-rf-textSoft/45 uppercase tracking-wider">Empty slot</p>
            )}
        </div>
    )
}
