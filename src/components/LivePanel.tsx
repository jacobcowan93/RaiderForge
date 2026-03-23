'use client'

/**
 * LivePanel.tsx
 *
 * Fixed right-side panel showing live ARC Raiders map conditions.
 * Desktop only (hidden on mobile).
 *
 * Layout reference: ARC_Raider_Syndicate home-maps-fixed sidebar (visual structure only)
 * Data source: MetaForge /events-schedule via useEventsSchedule hook
 * Fallback: community rotation table when API is unavailable
 *
 * Attribution: Some ARC Raiders data provided by MetaForge (metaforge.app/arc-raiders)
 */

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useEventsSchedule } from '../hooks/useEventsSchedule'
import { getActiveConditionsForMap } from '../lib/events/conditions'
import { getEventStyle, EVENT_ICONS } from '../lib/events/eventsConfig'
import { fmtCountdown } from '../lib/events/rotationTable'
import { MAPS, getMapThumbnail } from '../data/maps'

// Risk level -> display style
const RISK_STYLE: Record<string, { label: string; classes: string }> = {
  Extreme: { label: 'EXTREME', classes: 'bg-rf-red/20 text-rf-red border border-rf-red/40' },
  High:    { label: 'HIGH',    classes: 'bg-rf-orange/20 text-rf-orange border border-rf-orange/40' },
  Medium:  { label: 'MED',     classes: 'bg-rf-yellow/20 text-rf-yellow border border-rf-yellow/40' },
  Low:     { label: 'LOW',     classes: 'bg-rf-green/20 text-rf-green border border-rf-green/40' },
}

function EventBadge({ name }: { name: string }) {
  const style = getEventStyle(name)
  const icon = EVENT_ICONS[name]
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none"
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
    >
      {icon && (
        <img src={icon} alt="" className="w-3 h-3 object-contain opacity-90" loading="lazy" />
      )}
      {name}
    </span>
  )
}

function MapConditionCard({
  map,
  now,
  apiEvents,
}: {
  map: (typeof MAPS)[number]
  now: Date
  apiEvents: import('../lib/events/conditions').MfEvent[]
}) {
  const conditions = getActiveConditionsForMap(map.id, now, apiEvents)
  const thumb = getMapThumbnail(map)
  const risk = RISK_STYLE[map.risk] ?? RISK_STYLE.Medium
  const hasLiveEvent = conditions.minor || conditions.major

  return (
    <Link
      href={`/maps/${map.id}`}
      className="group block rounded-lg overflow-hidden border border-white/5 hover:border-white/15 transition-all"
    >
      {/* Thumbnail row */}
      <div className="relative h-16 bg-rf-bgSoft overflow-hidden">
        <img
          src={thumb}
          alt={map.displayName}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
          loading="lazy"
        />
        {/* Risk badge */}
        <span className={`absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${risk.classes}`}>
          {risk.label}
        </span>
        {/* Fallback indicator — subtle, only when rotation is used */}
        {conditions.source === 'rotation-fallback' && (
          <span className="absolute bottom-1 left-1.5 text-[9px] text-white/25">Fallback</span>
        )}
      </div>

      {/* Info row */}
      <div className="px-2.5 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-white/80 truncate">{map.displayName}</span>
          {/* Countdown to next event or next hour */}
          <span className="text-[10px] text-white/30 tabular-nums ml-2 shrink-0">
            {fmtCountdown(conditions.msLeftInHour)}
          </span>
        </div>

        {/* Active events */}
        {hasLiveEvent ? (
          <div className="flex flex-wrap gap-1">
            {conditions.minor && <EventBadge name={conditions.minor} />}
            {conditions.major && <EventBadge name={conditions.major} />}
          </div>
        ) : (
          <span className="text-[10px] text-white/25">No active events</span>
        )}
      </div>
    </Link>
  )
}

export default function LivePanel() {
  const { events, loading, error } = useEventsSchedule()
  const [now, setNow] = useState(() => new Date())

  // 1-second clock for countdown timers
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    // Fixed panel — desktop only. Aligned to right edge of viewport.
    // Page content uses xl:pr-[var(--live-panel-w)] to avoid overlap.
    <aside
      className="hidden xl:flex flex-col fixed top-16 right-0 w-[300px] h-[calc(100vh-4rem)] z-40"
      aria-label="Live Map Conditions"
    >
      <div className="rf-glass flex flex-col h-full border-l border-white/5">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rf-green animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">
              Active Maps
            </span>
          </div>
          <Link
            href="/maps"
            className="text-[10px] text-rf-textSoft/60 hover:text-rf-text transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Map cards — scrollable */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2">
          {loading && events.length === 0 ? (
            // Loading skeleton
            <>
              {MAPS.map(m => (
                <div key={m.id} className="rounded-lg bg-white/3 h-[88px] animate-pulse" />
              ))}
            </>
          ) : (
            MAPS.map(map => (
              <MapConditionCard key={map.id} map={map} now={now} apiEvents={events} />
            ))
          )}

          {/* API error notice — only when live data failed AND we've finished loading */}
          {error && !loading && (
            <p className="text-[9px] text-white/20 text-center pt-1">
              Using fallback rotation data
            </p>
          )}
        </div>

        {/* Footer attribution */}
        <div className="px-3 py-2 border-t border-white/5 shrink-0">
          <p className="text-[9px] text-white/20 leading-relaxed text-center">
            via{' '}
            <a
              href="https://metaforge.app/arc-raiders"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/40 transition-colors"
            >
              MetaForge
            </a>
          </p>
        </div>
      </div>
    </aside>
  )
}
