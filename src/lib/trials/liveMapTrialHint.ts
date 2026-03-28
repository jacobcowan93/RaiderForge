import type { MfEvent } from '@/lib/events/conditions'
import { getLiveMapConditions } from '@/lib/live-data/mapConditions'

export function formatLiveHintForMap(mapId: string, now: Date, events: MfEvent[], upstreamOk: boolean): string | null {
    const cond = getLiveMapConditions(mapId, now, events, upstreamOk)
    if (cond.source === 'api' && cond.activeConditions.length > 0) {
        return `${cond.activeConditions.join(', ')} (MetaForge schedule) — factor into route timing.`
    }
    if (cond.source === 'rotation-fallback' && cond.activeConditions.length > 0) {
        return `${cond.activeConditions.join(', ')} (rotation fallback) — verify in-raid.`
    }
    return null
}
