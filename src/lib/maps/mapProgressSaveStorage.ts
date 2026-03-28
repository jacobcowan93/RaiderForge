import {
    emptyMapProgressSave,
    type MapProgressSaveV1,
    type MapProgressSliceV1,
} from '@/lib/maps/mapProgressSave'

const STORAGE_KEY = 'raiderforge.map-progress.v1'

function isV1(v: unknown): v is MapProgressSaveV1 {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return false
    const o = v as Record<string, unknown>
    return o.version === 1 && o.maps !== null && typeof o.maps === 'object' && !Array.isArray(o.maps)
}

function sanitizeMaps(raw: unknown): MapProgressSaveV1['maps'] {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: MapProgressSaveV1['maps'] = {}
    for (const [mapId, slice] of Object.entries(raw as Record<string, unknown>)) {
        const mid = mapId.trim()
        if (!mid || mid.length > 64) continue
        if (slice === null || typeof slice !== 'object' || Array.isArray(slice)) continue
        const s = slice as Record<string, unknown>
        const q = sanitizeBucket(s.q)
        const c = sanitizeBucket(s.c)
        const l = sanitizeBucket(s.l)
        if (Object.keys(q).length + Object.keys(c).length + Object.keys(l).length === 0) continue
        const entry: MapProgressSliceV1 = {}
        if (Object.keys(q).length) entry.q = q
        if (Object.keys(c).length) entry.c = c
        if (Object.keys(l).length) entry.l = l
        out[mid] = entry
    }
    return out
}

function sanitizeBucket(v: unknown): Record<string, boolean> {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return {}
    const out: Record<string, boolean> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        const key = k.trim()
        if (!key || key.length > 256) continue
        if (val === true) out[key] = true
    }
    return out
}

export function loadMapProgressSave(): MapProgressSaveV1 {
    if (typeof window === 'undefined') return emptyMapProgressSave()
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return emptyMapProgressSave()
        const parsed = JSON.parse(raw) as unknown
        if (!isV1(parsed)) return emptyMapProgressSave()
        return { version: 1, maps: sanitizeMaps(parsed.maps) }
    } catch {
        return emptyMapProgressSave()
    }
}

export function saveMapProgressSave(save: MapProgressSaveV1): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
    } catch {
        /* quota */
    }
}
