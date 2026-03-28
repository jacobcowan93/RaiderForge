'use client'

/**
 * LivePanel.tsx
 *
 * Live ARC Raiders map conditions: desktop rail + mobile bottom dock.
 *
 * Layout reference: ARC_Raider_Syndicate home-maps-fixed sidebar (visual structure only)
 * Data source: MetaForge /events-schedule via useEventsSchedule hook
 * Fallback: community rotation table when API is unavailable
 *
 * Attribution: Some ARC Raiders data provided by MetaForge (metaforge.app/arc-raiders)
 */

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { LiveDataFeedStrip } from '@/components/live-data/LiveDataFeedStrip'
import { LiveDataStatusChip } from '@/components/live-data/LiveDataStatusChip'
import { useEventsSchedule } from '../hooks/useEventsSchedule'
import { getLiveMapConditions } from '@/lib/live-data/mapConditions'
import { deriveLiveDataChipKind } from '@/lib/live-data/feedState'
import { formatLocalTimestampFull } from '@/lib/live-data/formatTimestamp'
import { METAFORGE_ATTRIBUTION } from '@/lib/live-data/attribution'
import { getEventStyle, EVENT_ICONS, getEventDescription } from '../lib/events/eventsConfig'
import { fmtCountdown } from '../lib/events/rotationTable'
import { MAPS, getMapThumbnail } from '../data/maps'
import type { GameMap } from '@/lib/game-data/types'
import { buildRfThumbnailOverrideUrls } from '@/lib/maps/rfGameMapBridge'
import { MapCoverImage } from '@/components/maps/MapCoverImage'
import { hubUrlForMapId } from '@/lib/maps/maps-hub-zone'

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
  const tip = getEventDescription(name)
  return (
    <span
      title={tip}
      aria-label={tip}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none cursor-help"
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
  events,
  upstreamOk,
  thumbByRfId,
}: {
  map: (typeof MAPS)[number]
  now: Date
  events: import('../lib/events/conditions').MfEvent[]
  upstreamOk: boolean | null
  thumbByRfId: Record<string, string>
}) {
  const conditions = getLiveMapConditions(map.id, now, events, upstreamOk)
  const thumb = thumbByRfId[map.id] ?? getMapThumbnail(map)
  const risk = RISK_STYLE[map.risk] ?? RISK_STYLE.Medium
  const hasLiveEvent = conditions.minor || conditions.major

  const hubHref = hubUrlForMapId(map.id)

  return (
    <div className="rounded-lg overflow-hidden border border-white/5 hover:border-white/15 transition-all bg-black/20">
      <Link href={hubHref} className="group block">
        <div className="relative h-16 bg-rf-bgSoft overflow-hidden">
          <MapCoverImage
            src={thumb}
            alt={`${map.displayName} — zone preview`}
            fill
            sizes="280px"
            className="object-cover opacity-60 group-hover:opacity-75 transition-opacity"
          />
          <span className={`absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${risk.classes}`}>
            {risk.label}
          </span>
          {conditions.source === 'rotation-fallback' && (
            <span className="absolute bottom-1 left-1.5 text-[9px] text-white/25">Fallback</span>
          )}
        </div>
      </Link>

      <div className="px-2.5 py-2 border-t border-white/[0.04]">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Link href={hubHref} className="text-[11px] font-semibold text-white/85 hover:text-white truncate min-w-0">
            {map.displayName}
          </Link>
          <span className="text-[10px] text-white/30 tabular-nums shrink-0" title="Time in current schedule window">
            {fmtCountdown(conditions.msLeftInHour)}
          </span>
        </div>

        {hasLiveEvent ? (
          <div className="flex flex-wrap gap-1">
            {conditions.minor && <EventBadge name={conditions.minor} />}
            {conditions.major && <EventBadge name={conditions.major} />}
          </div>
        ) : (
          <span className="text-[10px] text-white/25">No active events</span>
        )}

        {conditions.source === 'api' && conditions.eventEndsAtMs != null ? (
          <p className="text-[9px] text-white/35 tabular-nums mt-1.5">
            Modifier window{' '}
            <span className="text-amber-200/90 font-semibold">
              {fmtCountdown(Math.max(0, conditions.eventEndsAtMs - now.getTime()))}
            </span>{' '}
            remaining
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {hasLiveEvent && (
            <Link
              href={hubHref}
              className="text-[9px] font-bold uppercase tracking-wide text-red-400/95 hover:text-red-300"
            >
              Jump to zone →
            </Link>
          )}
          <Link
            href={`/maps/${map.id}`}
            className="text-[9px] text-white/35 hover:text-white/60"
          >
            Tactical map
          </Link>
        </div>
      </div>
    </div>
  )
}

function LivePanelMapList({
  loading,
  events,
  now,
  upstreamOk,
  thumbByRfId,
}: {
  loading: boolean
  events: import('../lib/events/conditions').MfEvent[]
  now: Date
  upstreamOk: boolean | null
  thumbByRfId: Record<string, string>
}) {
  return (
    <>
      {loading && events.length === 0 ? (
        <>
          <p className="text-[9px] text-center text-white/25 uppercase tracking-wider mb-1">Loading MetaForge…</p>
          {MAPS.map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-white/[0.04] overflow-hidden animate-pulse"
            >
              <div className="h-16 bg-gradient-to-r from-white/[0.06] to-white/[0.02]" />
              <div className="h-10 bg-white/[0.03] px-2.5 py-2 space-y-1.5">
                <div className="h-2 w-2/3 bg-white/[0.06] rounded" />
                <div className="h-2 w-1/2 bg-white/[0.05] rounded" />
              </div>
            </div>
          ))}
        </>
      ) : (
        MAPS.map((map) => (
          <MapConditionCard
            key={map.id}
            map={map}
            now={now}
            events={events}
            upstreamOk={upstreamOk}
            thumbByRfId={thumbByRfId}
          />
        ))
      )}
    </>
  )
}

function LivePanelChrome({
  children,
  headerExtra,
  fetchedAt,
  upstreamOk,
  polledEventCount,
  loading,
  now,
}: {
  children: ReactNode
  headerExtra?: ReactNode
  fetchedAt: string | null
  upstreamOk: boolean | null
  polledEventCount: number
  loading: boolean
  now: Date
}) {
  const footerFullTs = fetchedAt ? formatLocalTimestampFull(fetchedAt) : null
  return (
    <div className="rf-glass flex flex-col h-full border-white/5 bg-[rgba(5,6,10,0.92)] backdrop-blur-xl">
      <div className="flex items-start justify-between px-3 pt-3 pb-2 border-b border-white/5 shrink-0 gap-2">
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold truncate">
              Live conditions
            </span>
          </div>
          <LiveDataFeedStrip
            now={now}
            fetchedAt={fetchedAt}
            upstreamOk={upstreamOk}
            polledEventCount={polledEventCount}
            loading={loading}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {headerExtra}
          <Link
            href="/maps"
            className="text-[10px] text-rf-textSoft/60 hover:text-rf-text transition-colors whitespace-nowrap"
            title="Maps hub: TroubleChute links + tactical view"
          >
            Command center →
          </Link>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 min-h-0">{children}</div>
      <div className="px-3 py-2 border-t border-white/5 shrink-0 space-y-1">
        <p className="text-[9px] text-white/20 leading-relaxed text-center">
          {METAFORGE_ATTRIBUTION.short}.{' '}
          <a
            href={METAFORGE_ATTRIBUTION.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rf-red/50 hover:text-rf-red/70 transition-colors"
          >
            {METAFORGE_ATTRIBUTION.name}
          </a>
          {footerFullTs ? (
            <>
              {' '}
              ·{' '}
              <span className="tabular-nums" title={footerFullTs}>
                {footerFullTs}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  )
}

export default function LivePanel() {
  const { events, loading, fetchedAt, upstreamOk } = useEventsSchedule()
  const [now, setNow] = useState(() => new Date())
  const [thumbByRfId, setThumbByRfId] = useState<Record<string, string>>({})
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/game/maps', { cache: 'no-store' })
      .then((r) => r.json())
      .then((body: unknown) => {
        if (cancelled || !body || typeof body !== 'object') return
        const o = body as { ok?: boolean; data?: { maps?: unknown } }
        if (!o.ok || !Array.isArray(o.data?.maps)) return
        setThumbByRfId(buildRfThumbnailOverrideUrls(o.data.maps as GameMap[]))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const list = (
    <LivePanelMapList
      loading={loading}
      events={events}
      now={now}
      upstreamOk={upstreamOk}
      thumbByRfId={thumbByRfId}
    />
  )

  const dockChipKind = deriveLiveDataChipKind({
    upstreamOk,
    fetchedAt,
    now,
    polledEventCount: events.length,
    loading,
  })

  return (
    <>
      <aside
        className="hidden xl:flex flex-col fixed top-16 right-0 w-[300px] h-[calc(100vh-4rem)] z-40 border-l border-white/5"
        aria-label="Live Map Conditions"
      >
        <LivePanelChrome
          fetchedAt={fetchedAt}
          upstreamOk={upstreamOk}
          polledEventCount={events.length}
          loading={loading}
          now={now}
        >
          {list}
        </LivePanelChrome>
      </aside>

      {/* Mobile / tablet: collapsible dock */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
        <div className="pointer-events-auto">
          {!mobileOpen ? (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex w-full flex-nowrap items-center justify-center gap-2 border-t border-white/10 bg-[rgba(5,6,10,0.96)] backdrop-blur-xl
                         px-3 sm:px-4 py-3 text-left shadow-[0_-8px_32px_rgba(0,0,0,0.55)] overflow-x-auto min-w-0"
            >
              <LiveDataStatusChip kind={dockChipKind} className="scale-95 origin-left" />
              <span className="text-xs font-semibold text-white/90 whitespace-nowrap">Active map conditions</span>
              <span className="text-[10px] text-white/40 whitespace-nowrap">Tap to expand</span>
            </button>
          ) : (
            <div
              className="max-h-[min(52vh,420px)] flex flex-col border-t border-white/10 rounded-t-2xl overflow-hidden shadow-[0_-12px_40px_rgba(0,0,0,0.6)]"
              role="dialog"
              aria-label="Live map conditions"
            >
              <LivePanelChrome
                fetchedAt={fetchedAt}
                upstreamOk={upstreamOk}
                polledEventCount={events.length}
                loading={loading}
                now={now}
                headerExtra={
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="text-[10px] font-medium text-white/45 hover:text-white border border-white/12 rounded-md px-2 py-0.5"
                  >
                    Close
                  </button>
                }
              >
                {list}
              </LivePanelChrome>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
