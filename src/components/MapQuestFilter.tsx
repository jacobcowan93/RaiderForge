'use client'

/**
 * MapQuestFilter.tsx
 *
 * Trader toggle bar rendered above the map tile viewer.
 * One button per trader who has quests on the current map.
 * Active traders (default: all) are shown with rf-red accent.
 * Clicking a trader toggles its markers on/off.
 * When any trader is hidden, a "Show All" clear button appears.
 */

import type { MergedQuest } from '../types/quests'
import type { CalibrationStatus } from '../data/mapCalibration'

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
   * 'approximate'  → subtle tilde prefix on visible count
   * 'uncalibrated' → note shown instead of count
   */
  calibrationStatus: CalibrationStatus
}

export default function MapQuestFilter({ quests, activeTraders, onToggle, onClearAll, calibrationStatus }: Props) {
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

  if (traders.length === 0) return null

  const hasFilter    = activeTraders.size < traders.length
  const visibleCount = quests.filter(q => activeTraders.has(q.traderId)).length

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.015] flex-wrap">
      <span className="text-[10px] uppercase tracking-widest text-white/20 mr-0.5 flex-shrink-0">
        Quests
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

      {/* Right side: clear-all + calibration status + visible count */}
      <span className="ml-auto flex items-center gap-1.5 flex-shrink-0">
        {/* Clear-all — only visible when a filter is active */}
        {hasFilter && (
          <button
            onClick={onClearAll}
            title="Show all traders"
            className="text-[9px] text-white/35 hover:text-white/70 border border-white/10 hover:border-white/25 rounded-full px-1.5 py-px transition-all"
          >
            Show all
          </button>
        )}

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
  )
}
