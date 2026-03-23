'use client'

/**
 * MapQuestFilter.tsx
 *
 * Two-row filter bar rendered above the map tile viewer.
 *
 * Row 1 — Layer toggles:
 *   One button per MapLayerType (Quests, Containers).
 *   Containers shows "—" count badge when no data is available.
 *   Right side: calibration status badge + total visible marker count.
 *
 * Row 2 — Trader toggles (only when quest layer is active and traders exist):
 *   One button per trader who has quests on the current map.
 *   Active traders shown with rf-red accent. "Show all" clear button
 *   appears when any trader is hidden.
 */

import type { MergedQuest } from '../types/quests'
import type { CalibrationStatus } from '../data/mapCalibration'
import type { MapLayerType } from '../types/mapLayers'
import { MAP_LAYER_DEFS } from '../types/mapLayers'

interface Props {
  /** All quests for this map — used to build the trader list + counts. */
  quests: MergedQuest[]
  /** Set of trader IDs currently shown. Managed by parent (MapImageDisplay). */
  activeTraders: Set<string>
  /** Called when a trader button is clicked — parent updates activeTraders. */
  onToggle: (traderId: string) => void
  /** Called when "Show All" is clicked — parent resets all traders to active. */
  onClearAll: () => void
  /**
   * Calibration status for this map from mapCalibration.ts.
   * 'verified'     → no indicator
   * 'approximate'  → subtle tilde prefix badge
   * 'uncalibrated' → note shown instead
   */
  calibrationStatus: CalibrationStatus
  /** Set of currently-enabled layer types. Managed by parent (MapImageDisplay). */
  activeLayers: Set<MapLayerType>
  /** Called when a layer button is clicked — parent toggles the layer. */
  onLayerToggle: (type: MapLayerType) => void
  /**
   * Total container marker count for this map.
   * 0 until real positional data is sourced — shows "—" badge in that state.
   */
  containerCount: number
}

export default function MapQuestFilter({
  quests,
  activeTraders,
  onToggle,
  onClearAll,
  calibrationStatus,
  activeLayers,
  onLayerToggle,
  containerCount,
}: Props) {
  // Build unique trader list from quests on this map, preserving insertion order
  const traders = Array.from(
    quests.reduce<Map<string, { name: string; icon: string | null; count: number }>>(
      (acc, q) => {
        const existing = acc.get(q.traderId)
        if (existing) {
          existing.count++
        } else {
          acc.set(q.traderId, { name: q.traderName, icon: q.traderIcon, count: 1 })
        }
        return acc
      },
      new Map(),
    ).entries(),
  ).map(([id, meta]) => ({ id, ...meta }))

  const hasFilter    = activeTraders.size < traders.length
  const visibleCount = quests.filter(q => activeTraders.has(q.traderId) && activeLayers.has('quests')).length
    + (activeLayers.has('containers') ? containerCount : 0)

  const layerCountFor = (type: MapLayerType): number | null => {
    if (type === 'quests')     return quests.length
    if (type === 'containers') return containerCount
    return null
  }

  return (
    <div>

      {/* ── Row 1: Layer toggles ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.015] flex-wrap">
        <span className="text-[10px] uppercase tracking-widest text-white/20 mr-0.5 flex-shrink-0">
          Layers
        </span>

        {MAP_LAYER_DEFS.map(layer => {
          const active = activeLayers.has(layer.type)
          const count  = layerCountFor(layer.type)
          const hasData = count !== null && count > 0

          return (
            <button
              key={layer.type}
              onClick={() => onLayerToggle(layer.type)}
              title={active ? `Hide ${layer.label}` : `Show ${layer.label}`}
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 border transition-all ${
                active
                  ? 'bg-rf-red/12 text-rf-red/90 border-rf-red/25 hover:bg-rf-red/20'
                  : 'text-white/20 hover:text-white/45 hover:bg-white/5 border-white/6'
              }`}
            >
              {/* Layer icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                className="w-3 h-3 flex-shrink-0"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={layer.iconPath} />
              </svg>

              {layer.label}

              {/* Count badge */}
              <span
                className={`text-[9px] font-bold rounded-full min-w-[16px] text-center px-1 ${
                  active ? 'bg-rf-red/20 text-rf-red/80' : 'bg-white/6 text-white/25'
                }`}
              >
                {hasData ? count : '—'}
              </span>
            </button>
          )
        })}

        {/* Right side: calibration status + visible count */}
        <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          {calibrationStatus === 'approximate' && (
            <span
              title="Marker positions are approximate. MetaForge world-space coordinates have not been verified against in-game landmarks."
              className="text-[9px] text-rf-yellow/40 border border-rf-yellow/15 rounded-full px-1.5 py-px cursor-help"
            >
              ~pos
            </span>
          )}
          {calibrationStatus === 'uncalibrated' && (
            <span
              title="Marker positions are uncalibrated for this map."
              className="text-[9px] text-white/25 border border-white/10 rounded-full px-1.5 py-px cursor-help"
            >
              unverified
            </span>
          )}
          <span className="text-[10px] text-white/15">
            {visibleCount} visible
          </span>
        </span>
      </div>

      {/* ── Row 2: Trader toggles (quest layer active only) ──────────────────── */}
      {activeLayers.has('quests') && traders.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/[0.008] flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-white/20 mr-0.5 flex-shrink-0">
            Traders
          </span>

          {traders.map(t => {
            const active = activeTraders.has(t.id)
            return (
              <button
                key={t.id}
                onClick={() => onToggle(t.id)}
                title={active ? `Hide ${t.name} quests` : `Show ${t.name} quests`}
                className={`inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1 border transition-all ${
                  active
                    ? 'bg-rf-red/12 text-rf-red/90 border-rf-red/25 hover:bg-rf-red/20'
                    : 'text-white/20 hover:text-white/45 hover:bg-white/5 border-white/6'
                }`}
              >
                {t.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.icon}
                    alt={t.name}
                    className={`w-3.5 h-3.5 rounded-full object-cover flex-shrink-0 ${active ? 'opacity-90' : 'opacity-30'}`}
                  />
                )}
                {t.name}
                <span
                  className={`text-[9px] font-bold rounded-full min-w-[16px] text-center px-1 ${
                    active ? 'bg-rf-red/20 text-rf-red/80' : 'bg-white/6 text-white/25'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            )
          })}

          {/* Clear-all — only visible when a filter is active */}
          {hasFilter && (
            <button
              onClick={onClearAll}
              title="Show all traders"
              className="text-[9px] text-white/35 hover:text-white/70 border border-white/10 hover:border-white/25 rounded-full px-1.5 py-px transition-all ml-auto"
            >
              Show all
            </button>
          )}
        </div>
      )}

    </div>
  )
}
