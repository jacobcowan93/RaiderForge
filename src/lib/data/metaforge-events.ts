/**
 * Server-oriented helpers for MetaForge live events (maps command center, etc.).
 * Base URL: https://metaforge.app/api/arc-raiders (events-schedule; event-timers deprecated upstream).
 */

import { fetchMfEventsScheduleWithStatus } from '@/api/metaforgeService'
import type { MfEvent } from '@/lib/events/conditions'

export type CurrentEventsResult = {
    events: MfEvent[]
    /** ISO timestamp when this payload was assembled (after upstream fetch). */
    fetchedAt: string
    /** Upstream HTTP / parse succeeded (events may still be empty). */
    upstreamOk: boolean
}

/**
 * Load current event schedule for maps conditions. Uses shared MetaForge client cache (60s TTL).
 */
export async function fetchCurrentEvents(): Promise<CurrentEventsResult> {
    const fetchedAt = new Date().toISOString()
    const { events, ok } = await fetchMfEventsScheduleWithStatus()
    return { events, fetchedAt, upstreamOk: ok }
}
