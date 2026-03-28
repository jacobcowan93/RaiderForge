'use client'

/**
 * POI UI helpers for the tactical map.
 *
 * Leaflet markers are drawn inside `MapTileViewer`; this module holds category filters
 * and the optional placement readout (dev / flag).
 */

import { useCallback, useMemo, useState } from 'react'
import type { PoiCategory } from '@/lib/maps/poi-types'
import { POI_CATEGORY_META } from './MapPoiMarker'

export type PoiPlacementSample = {
    mapId: string
    x: number
    y: number
    floorIndex: number
}

export function MapPoiCategoryRow({
    activePoiCategories,
    onToggleCategory,
    onShowAll,
    showOnlyUnvisited,
    onShowOnlyUnvisitedChange,
}: {
    activePoiCategories: ReadonlySet<PoiCategory>
    onToggleCategory: (c: PoiCategory) => void
    onShowAll: () => void
    showOnlyUnvisited: boolean
    onShowOnlyUnvisitedChange: (value: boolean) => void
}) {
    const categories = useMemo(() => Object.keys(POI_CATEGORY_META) as PoiCategory[], [])
    const allOn = categories.every(c => activePoiCategories.has(c))

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.006] flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-white/20 mr-0.5 flex-shrink-0">
                Pins
            </span>
            {categories.map(c => {
                const active = activePoiCategories.has(c)
                const meta = POI_CATEGORY_META[c]
                return (
                    <button
                        key={c}
                        type="button"
                        onClick={() => onToggleCategory(c)}
                        title={active ? `Hide ${meta.label}` : `Show ${meta.label}`}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 border transition-all ${
                            active
                                ? 'bg-rf-red/12 text-rf-red/90 border-rf-red/25 hover:bg-rf-red/20'
                                : 'text-white/20 hover:text-white/45 hover:bg-white/5 border-white/6'
                        }`}
                    >
                        <span
                            className="w-2 h-2 rounded-sm flex-shrink-0 border border-white/20"
                            style={{ background: meta.color }}
                            aria-hidden
                        />
                        {meta.label}
                    </button>
                )
            })}
            <div className="ml-auto flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                <button
                    type="button"
                    role="switch"
                    aria-checked={showOnlyUnvisited}
                    title={showOnlyUnvisited ? 'Show all pins (including visited)' : 'Hide pins you marked visited'}
                    onClick={() => onShowOnlyUnvisitedChange(!showOnlyUnvisited)}
                    className={`text-[10px] font-medium rounded-full px-2.5 py-1 border transition-all ${
                        showOnlyUnvisited
                            ? 'bg-rf-red/12 text-rf-red/90 border-rf-red/25 hover:bg-rf-red/20'
                            : 'text-white/35 hover:text-white/60 border-white/10 hover:border-white/20'
                    }`}
                >
                    Show only unvisited
                </button>
                {!allOn && (
                    <button
                        type="button"
                        onClick={onShowAll}
                        className="text-[9px] text-white/35 hover:text-white/70 border border-white/10 hover:border-white/25 rounded-full px-1.5 py-px transition-all"
                    >
                        Show all
                    </button>
                )}
            </div>
        </div>
    )
}

export function PoiPlacementReadout({
    sample,
    placementMode,
    onToggleMode,
    onClear,
}: {
    sample: PoiPlacementSample | null
    placementMode: boolean
    onToggleMode: () => void
    onClear: () => void
}) {
    const [copied, setCopied] = useState(false)

    const jsonSnippet = useMemo(() => {
        if (!sample) return ''
        return `{
  "id": "",
  "mapId": "${sample.mapId}",
  "name": "",
  "category": "extract",
  "x": ${sample.x},
  "y": ${sample.y}${sample.floorIndex > 0 ? `,\n  "floorIndex": ${sample.floorIndex}` : ''}
}`
    }, [sample])

    const copy = useCallback(async () => {
        if (!jsonSnippet) return
        try {
            await navigator.clipboard.writeText(jsonSnippet)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch {
            /* ignore */
        }
    }, [jsonSnippet])

    return (
        <div className="absolute top-12 left-3 z-[520] flex flex-col gap-2 max-w-[min(100vw-1.5rem,18rem)] pointer-events-auto">
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={onToggleMode}
                    className={`text-[10px] font-semibold uppercase tracking-wider rounded-lg border px-2.5 py-1.5 transition-colors ${
                        placementMode
                            ? 'border-rf-red/40 bg-rf-red/15 text-rf-red'
                            : 'border-white/15 bg-white/5 text-rf-text hover:border-white/25'
                    }`}
                >
                    {placementMode ? 'Placement on' : 'Placement off'}
                </button>
                {sample && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-[9px] text-white/35 hover:text-white/60 border border-white/10 rounded px-2 py-1"
                    >
                        Clear
                    </button>
                )}
            </div>
            {placementMode && (
                <p className="text-[9px] text-white/40 leading-snug">
                    Click the map to sample coordinates (percent of full tactical image). Paste into{' '}
                    <code className="text-white/50">src/data/pois/</code>.
                </p>
            )}
            {sample && (
                <div className="rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm p-2.5 text-[10px] text-white/70 font-mono leading-relaxed">
                    <div className="text-white/45 text-[9px] uppercase tracking-wider mb-1">Last sample</div>
                    <div>
                        x: {sample.x} &nbsp; y: {sample.y}
                        {sample.floorIndex > 0 && (
                            <>
                                {' '}
                                · floor: {sample.floorIndex}
                            </>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={copy}
                        className="mt-2 text-[9px] font-semibold uppercase tracking-wide text-rf-green hover:text-rf-green/80"
                    >
                        {copied ? 'Copied' : 'Copy JSON snippet'}
                    </button>
                    <pre className="mt-2 text-[9px] text-white/50 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                        {jsonSnippet}
                    </pre>
                </div>
            )}
        </div>
    )
}
