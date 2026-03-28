import type { GameMapEvent, GameMapEventsBundle } from '../types'
import { asBoolean, asString } from './common'

function normalizeEventTypeEntry(key: string, raw: unknown): GameMapEvent | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const displayName = asString(r.displayName ?? r.display_name) ?? key
    return {
        id: key,
        displayName,
        category: asString(r.category),
        iconUrl: asString(r.icon ?? r.iconUrl),
        disabled: asBoolean(r.disabled, false),
    }
}

export function normalizeGameMapEventsBundle(raw: unknown): GameMapEventsBundle {
    const empty: GameMapEventsBundle = {
        eventTypes: [],
        maps: null,
        schedule: null,
        readme: null,
    }
    if (!raw || typeof raw !== 'object') return empty

    // Paginated wrapper
    const root = raw as Record<string, unknown>
    const firstItem =
        Array.isArray(root.items) && root.items.length > 0 ? root.items[0] : raw

    if (!firstItem || typeof firstItem !== 'object') return empty
    const blob = firstItem as Record<string, unknown>

    const eventTypesRaw = blob.eventTypes
    const events: GameMapEvent[] = []
    if (eventTypesRaw && typeof eventTypesRaw === 'object' && !Array.isArray(eventTypesRaw)) {
        for (const [key, val] of Object.entries(eventTypesRaw as Record<string, unknown>)) {
            const n = normalizeEventTypeEntry(key, val)
            if (n) events.push(n)
        }
    }

    return {
        eventTypes: events,
        maps: blob.maps ?? null,
        schedule: blob.schedule ?? null,
        readme: blob._readme ?? null,
    }
}
