'use client'

import Link from 'next/link'

import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'
import { LOADOUT_SLOTS, type LoadoutItemRef, type LoadoutSlotId } from '@/lib/loadouts/loadoutTypes'

import { btnGhost, btnSave, inputCls } from '../_lib/loadout-ui'

function sumWeight(slots: Partial<Record<LoadoutSlotId, LoadoutItemRef>>): number | null {
    let n = 0
    let any = false
    let unknown = false
    for (const ref of Object.values(slots)) {
        if (!ref) continue
        any = true
        if (ref.weight == null || Number.isNaN(ref.weight)) unknown = true
        else n += ref.weight
    }
    if (!any) return null
    if (unknown) return null
    return n
}

export function LoadoutSummaryPanel({
    loadoutName,
    onNameChange,
    slots,
    onSave,
    onClearAll,
    justSaved,
}: {
    loadoutName: string
    onNameChange: (v: string) => void
    slots: Partial<Record<LoadoutSlotId, LoadoutItemRef>>
    onSave: () => void
    onClearAll: () => void
    justSaved: boolean
}) {
    const filled = Object.keys(slots).filter((k) => slots[k as LoadoutSlotId]).length
    const totalSlots = LOADOUT_SLOTS.length
    const w = sumWeight(slots)

    return (
        <div className="rf-card rounded-xl border border-blue-950/35 border-l-rf-red/25 bg-[#050810]/50 flex flex-col">
            <div className="px-3 py-3 sm:px-4 border-b border-white/[0.06]">
                <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-rf-textSoft/90">Briefing</h2>
                <p className="text-[11px] text-rf-textSoft/65 mt-1 leading-relaxed">
                    Saved in this browser only. Event synergy and cloud sync are planned.
                </p>
            </div>
            <div className="p-3 sm:p-4 space-y-4 flex-1">
                <div>
                    <label htmlFor="lo-name" className="text-xs uppercase tracking-wider text-rf-textSoft block mb-1.5">
                        Loadout name
                    </label>
                    <input
                        id="lo-name"
                        type="text"
                        value={loadoutName}
                        onChange={(e) => onNameChange(e.target.value)}
                        placeholder="e.g. Weeknight raid"
                        className={inputCls}
                    />
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2.5 space-y-2">
                    <div className="flex justify-between gap-2 text-[11px]">
                        <span className="text-rf-textSoft/70 uppercase tracking-wide font-semibold">Slots used</span>
                        <span className="text-white font-bold tabular-nums">
                            {filled} / {totalSlots}
                        </span>
                    </div>
                    <div className="flex justify-between gap-2 text-[11px]">
                        <span className="text-rf-textSoft/70 uppercase tracking-wide font-semibold">Est. weight</span>
                        <span className="text-rf-textSoft font-bold tabular-nums">
                            {w != null ? `${w.toFixed(1)} kg` : '—'}
                        </span>
                    </div>
                    <p className="text-[9px] text-rf-textSoft/45 leading-snug pt-1 border-t border-white/[0.05]">
                        Weight sums catalog values when present; many items omit mass in the feed.
                    </p>
                </div>

                <button type="button" className={btnSave} onClick={onSave}>
                    Save loadout
                </button>
                {justSaved ? (
                    <p className="text-[11px] text-emerald-400/90 font-medium text-center" role="status">
                        Saved to this device
                    </p>
                ) : null}

                <button type="button" className={btnGhost} onClick={onClearAll}>
                    Clear all slots
                </button>
            </div>
            <div className="px-3 py-3 sm:px-4 border-t border-white/[0.06] text-[10px] text-rf-textSoft/55 leading-relaxed">
                Gear data from{' '}
                <Link href={ARDB_CATALOG_ATTRIBUTION.providerUrl} className="text-rf-red/85 hover:underline">
                    ardb.app
                </Link>
                .
            </div>
        </div>
    )
}
