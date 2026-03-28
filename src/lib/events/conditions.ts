/**
 * conditions.ts
 *
 * Calculates active map conditions for the LivePanel and map pages.
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
 * Adjust as needed once real API responses are observed.
 */
export type MfEvent = {
  map?: string          // Map identifier (may use various key formats)
  mapId?: string        // Alternative map identifier
  name?: string         // Event name, e.g. "Hurricane"
  event?: string        // Alternative event name field
  minor?: string | null
  major?: string | null
  startTime?: string    // ISO timestamp
  endTime?: string      // ISO timestamp
  [key: string]: unknown
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
   * Used for "modifier ends in" countdown in LivePanel.
   */
  eventEndsAtMs: number | null
}

/** Normalize various map key formats to our route IDs (exported for tests / batch tooling). */
export function normalizeMapKey(raw: string): string {
  const key = raw.toLowerCase().replace(/\s+/g, '-')
  const ALIASES: Record<string, string> = {
    dam:               'dam-battlegrounds',
    'dam-battleground': 'dam-battlegrounds',
    buried:            'burial-city',
    'buried-city':     'burial-city',
    space:             'spaceport',
    blue:              'blue-gate',
    stella:            'stella-montis',
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
  if (!event.startTime || !event.endTime) return true
  const start = new Date(event.startTime).getTime()
  const end = new Date(event.endTime).getTime()
  const t = now.getTime()
  return t >= start && t < end
}

/** Earliest valid future endTime among rows (epoch ms), or null. */
export function mfEventEarliestEndMsAfter(events: MfEvent[], referenceMs: number): number | null {
  let best: number | null = null
  for (const e of events) {
    if (!e.endTime || typeof e.endTime !== 'string') continue
    const end = new Date(e.endTime).getTime()
    if (Number.isNaN(end) || end <= referenceMs) continue
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
  const msLeftInHour = (60 - now.getUTCMinutes()) * 60 * 1000 - now.getUTCSeconds() * 1000 - now.getUTCMilliseconds()

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
