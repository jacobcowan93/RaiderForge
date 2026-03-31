/**
 * conditions.ts
 *
 * Calculates active map conditions for map pages and the command center.
 *
 * Source priority:
 *   1. MetaForge /events-schedule API (primary — live data)
 *   2. Community rotation table (fallback — see rotationTable.ts)
 *
 * MfEvent shape is based on MetaForge's documented /events-schedule endpoint.
 * The exact schema may change — this is intentionally defensive.
 */

import { getRotationForMap, getNextRotationEvent } from './rotationTable'
import { isMajorEvent } from './eventsConfig'

/**
 * Shape of an event returned by MetaForge /events-schedule.
 * Fields are optional/nullable because the API schema is not fully published.
 *
 * Note: MetaForge sends startTime / endTime as Unix millisecond integers,
 * not ISO strings. Both formats are accepted throughout this module.
 */
export type MfEvent = {
  map?: string                  // Map identifier (may use various key formats)
  mapId?: string                // Alternative map identifier
  name?: string                 // Event name, e.g. "Hurricane"
  event?: string                // Alternative event name field
  minor?: string | null
  major?: string | null
  startTime?: string | number   // Unix ms integer OR ISO string
  endTime?: string | number     // Unix ms integer OR ISO string
  [key: string]: unknown
}

/**
 * Normalize a MetaForge timestamp (Unix ms number, numeric string, or ISO string)
 * to epoch milliseconds. Returns null when the value is missing or unparseable.
 */
function parseMfTimestamp(v: string | number | undefined | null): number | null {
  if (v == null) return null
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return null
    // MetaForge timestamps are always in milliseconds (> 1e12 for post-2001 dates).
    // Guard against accidental seconds values just in case.
    return v < 1e10 ? v * 1000 : v
  }
  // String: try numeric first, then ISO
  const trimmed = String(v).trim()
  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed)
    return Number.isFinite(n) ? (n < 1e10 ? n * 1000 : n) : null
  }
  const d = new Date(trimmed).getTime()
  return Number.isNaN(d) ? null : d
}

/** Milliseconds remaining in the current UTC hour (shared schedule window tick). */
export function msLeftInUtcHour(now: Date): number {
  const ms = now.getTime()
  // Floor to current hour boundary, then add one hour.
  const nextHourMs = (Math.floor(ms / 3_600_000) + 1) * 3_600_000
  return nextHourMs - ms
}

export type MapConditions = {
  minor: string | null
  major: string | null
  activeConditions: string[]
  /** Milliseconds remaining in the current hour (for countdown). */
  msLeftInHour: number
  /** Next upcoming event from either API or rotation. */
  nextEvent: { hoursAway: number; minor: string | null; major: string | null } | null
  /** 'api' = from MetaForge live data; 'rotation-fallback' = community rotation */
  source: 'api' | 'rotation-fallback'
  /**
   * When MetaForge supplies endTime on active rows, earliest end among matching events (epoch ms).
   * Used for "modifier ends in" countdown on command center zone cards when sourced from MetaForge.
   */
  eventEndsAtMs: number | null
}

/** Normalize various map key formats to our route IDs (exported for tests / batch tooling). */
export function normalizeMapKey(raw: string): string {
  // Normalize: lowercase, collapse whitespace/underscores to hyphens
  const key = raw.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '')
  const ALIASES: Record<string, string> = {
    // Dam Battlegrounds
    dam:                   'dam-battlegrounds',
    'dam-battleground':    'dam-battlegrounds',
    'dam-battlegrounds':   'dam-battlegrounds',
    'the-dam':             'dam-battlegrounds',
    battlegrounds:         'dam-battlegrounds',
    // Burial City (MetaForge calls it "Buried City")
    buried:                'burial-city',
    'buried-city':         'burial-city',
    'burial-city':         'burial-city',
    // Spaceport
    space:                 'spaceport',
    spaceport:             'spaceport',
    // Blue Gate
    blue:                  'blue-gate',
    'blue-gate':           'blue-gate',
    bluegate:              'blue-gate',
    // Stella Montis
    stella:                'stella-montis',
    'stella-montis':       'stella-montis',
    stellamontis:          'stella-montis',
  }
  return ALIASES[key] ?? key
}

/** Route id for map matching, or null when the row has no map key. */
export function mfEventMapRouteId(event: MfEvent): string | null {
  const raw = event.map ?? event.mapId ?? ''
  if (!raw || typeof raw !== 'string') return null
  return normalizeMapKey(raw)
}

/** Whether the row is active at `now` when start/end are present. */
export function mfEventIsActiveAt(event: MfEvent, now: Date): boolean {
  // If either timestamp is absent, treat the event as always active (defensive).
  if (event.startTime == null || event.endTime == null) return true
  const start = parseMfTimestamp(event.startTime)
  const end   = parseMfTimestamp(event.endTime)
  // If we can't parse the timestamps, don't hide the event.
  if (start === null || end === null) return true
  const t = now.getTime()
  return t >= start && t < end
}

/** Earliest valid future endTime among rows (epoch ms), or null. */
export function mfEventEarliestEndMsAfter(events: MfEvent[], referenceMs: number): number | null {
  let best: number | null = null
  for (const e of events) {
    const end = parseMfTimestamp(e.endTime)
    if (end === null || end <= referenceMs) continue
    if (best === null || end < best) best = end
  }
  return best
}

/**
 * Get the active conditions for a specific map.
 *
 * @param mapId      Route ID, e.g. "dam-battlegrounds"
 * @param now        Current Date (pass Date.now() or new Date())
 * @param apiEvents  Optional array from MetaForge /events-schedule — used first if available
 */
export function getActiveConditionsForMap(
  mapId: string,
  now: Date,
  apiEvents?: MfEvent[]
): MapConditions {
  const utcHour = now.getUTCHours()
  const msLeftInHour = msLeftInUtcHour(now)

  // ── Try MetaForge API events first ────────────────────────────────────────
  if (apiEvents && apiEvents.length > 0) {
    const mapEvents = apiEvents.filter(
      (e) => mfEventMapRouteId(e) === mapId && mfEventIsActiveAt(e, now),
    )

    if (mapEvents.length > 0) {
      // Extract minor/major from the event data
      let minor: string | null = null
      let major: string | null = null
      const tNow = now.getTime()

      for (const e of mapEvents) {
        const eventName = e.name ?? e.event ?? null
        if (!eventName) {
          if (e.minor) minor = e.minor
          if (e.major) major = e.major
        } else if (isMajorEvent(eventName)) {
          major = eventName
        } else {
          minor = eventName
        }
      }

      const eventEndsAtMs = mfEventEarliestEndMsAfter(mapEvents, tNow)

      const activeConditions = [minor, major].filter((v): v is string => v !== null)
      return {
        minor,
        major,
        activeConditions,
        msLeftInHour,
        nextEvent: null, // TODO: parse next event from full schedule ahead of now
        source: 'api',
        eventEndsAtMs,
      }
    }
  }

  // ── Fallback: community rotation table ────────────────────────────────────
  const { minor, major } = getRotationForMap(mapId, utcHour)
  const activeConditions = [minor, major].filter((v): v is string => v !== null)
  const nextEvent = getNextRotationEvent(mapId, utcHour)

  return {
    minor,
    major,
    activeConditions,
    msLeftInHour,
    nextEvent,
    source: 'rotation-fallback',
    eventEndsAtMs: null,
  }
}
