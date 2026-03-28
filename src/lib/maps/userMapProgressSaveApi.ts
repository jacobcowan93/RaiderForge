import {
    emptyMapProgressSave,
    MAP_PROGRESS_SAVE_VERSION,
    type MapProgressSaveV1,
    type MapProgressSliceV1,
} from '@/lib/maps/mapProgressSave'

const MAX_MAP_IDS = 80
const MAX_KEYS_PER_BUCKET = 400

export type ParsedMapProgressSave = { ok: true; save: MapProgressSaveV1 } | { ok: false; error: string }

type BucketParse = { ok: true; bucket: Record<string, boolean> } | { ok: false; error: string }

function sanitizeBucketIn(v: unknown, label: string): BucketParse {
    if (v === undefined || v === null) return { ok: true, bucket: {} }
    if (typeof v !== 'object' || Array.isArray(v)) {
        return { ok: false, error: `Invalid "${label}" bucket.` }
    }
    const out: Record<string, boolean> = {}
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        const key = k.trim()
        if (!key || key.length > 256) {
            return { ok: false, error: `Invalid ${label} key.` }
        }
        if (val !== true) {
            return { ok: false, error: `Invalid ${label} value for "${key.slice(0, 40)}…".` }
        }
        out[key] = true
        if (Object.keys(out).length > MAX_KEYS_PER_BUCKET) {
            return { ok: false, error: `At most ${MAX_KEYS_PER_BUCKET} entries per ${label} bucket.` }
        }
    }
    return { ok: true, bucket: out }
}

export function parseMapProgressSaveBody(body: unknown): ParsedMapProgressSave {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return { ok: false, error: 'Body must be a JSON object.' }
    }
    const saveRaw = (body as { save?: unknown }).save
    if (saveRaw === null || typeof saveRaw !== 'object' || Array.isArray(saveRaw)) {
        return { ok: false, error: 'Missing or invalid "save" object.' }
    }
    const s = saveRaw as Record<string, unknown>
    if (s.version !== MAP_PROGRESS_SAVE_VERSION) {
        return { ok: false, error: `Unsupported save version (expected ${MAP_PROGRESS_SAVE_VERSION}).` }
    }
    const mapsRaw = s.maps
    if (mapsRaw === null || typeof mapsRaw !== 'object' || Array.isArray(mapsRaw)) {
        return { ok: false, error: 'Invalid "maps" object.' }
    }
    const mapKeys = Object.keys(mapsRaw as object)
    if (mapKeys.length > MAX_MAP_IDS) {
        return { ok: false, error: `At most ${MAX_MAP_IDS} maps per save.` }
    }
    const maps: MapProgressSaveV1['maps'] = {}
    for (const [mapId, sliceRaw] of Object.entries(mapsRaw as Record<string, unknown>)) {
        const mid = mapId.trim()
        if (!mid || mid.length > 64) {
            return { ok: false, error: 'Invalid map id.' }
        }
        if (sliceRaw === null || typeof sliceRaw !== 'object' || Array.isArray(sliceRaw)) {
            return { ok: false, error: `Invalid slice for map "${mid}".` }
        }
        const sl = sliceRaw as Record<string, unknown>
        const q = sanitizeBucketIn(sl.q, 'q')
        if (q.ok === false) return q
        const c = sanitizeBucketIn(sl.c, 'c')
        if (c.ok === false) return c
        const l = sanitizeBucketIn(sl.l, 'l')
        if (l.ok === false) return l
        const p = sanitizeBucketIn(sl.p, 'p')
        if (p.ok === false) return p
        const slice: MapProgressSliceV1 = {}
        if (Object.keys(q.bucket).length) slice.q = q.bucket
        if (Object.keys(c.bucket).length) slice.c = c.bucket
        if (Object.keys(l.bucket).length) slice.l = l.bucket
        if (Object.keys(p.bucket).length) slice.p = p.bucket
        if (Object.keys(slice).length) maps[mid] = slice
    }
    return { ok: true, save: { version: 1, maps } }
}

export function mapProgressSaveFromJson(json: unknown): MapProgressSaveV1 {
    const parsed = parseMapProgressSaveBody({ save: json })
    if (parsed.ok) return parsed.save
    return emptyMapProgressSave()
}
