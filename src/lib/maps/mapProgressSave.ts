/** Per RaiderForge map id (`MapMeta.id`): which POIs the user marked visited. */
export type MapProgressSliceV1 = {
    /** Quest display name (`MergedQuest.name`) → visited */
    q?: Record<string, boolean>
    /** Container marker id → visited */
    c?: Record<string, boolean>
    /** Loot area marker id → visited */
    l?: Record<string, boolean>
    /** Curated `MapPoi.id` → visited (Pins layer); synced with `/api/user/map-progress` when signed in. */
    p?: Record<string, boolean>
}

export type MapProgressSaveV1 = {
    version: 1
    maps: Record<string, MapProgressSliceV1>
}

export const MAP_PROGRESS_SAVE_VERSION = 1 as const

export function emptyMapProgressSave(): MapProgressSaveV1 {
    return { version: 1, maps: {} }
}

export function emptyMapSlice(): MapProgressSliceV1 {
    return {}
}

/** True if no visited flags anywhere. */
export function isMapProgressSaveEmpty(save: MapProgressSaveV1): boolean {
    if (!save.maps || typeof save.maps !== 'object') return true
    for (const slice of Object.values(save.maps)) {
        if (sliceCount(slice) > 0) return false
    }
    return true
}

export function sliceCount(slice: MapProgressSliceV1 | undefined): number {
    if (!slice) return 0
    return countTrue(slice.q) + countTrue(slice.c) + countTrue(slice.l) + countTrue(slice.p)
}

function countTrue(rec: Record<string, boolean> | undefined): number {
    if (!rec) return 0
    return Object.values(rec).filter(Boolean).length
}

export function getSlice(save: MapProgressSaveV1, mapId: string): MapProgressSliceV1 {
    const s = save.maps[mapId]
    if (!s) return emptyMapSlice()
    return {
        q: s.q ? { ...s.q } : {},
        c: s.c ? { ...s.c } : {},
        l: s.l ? { ...s.l } : {},
        p: s.p ? { ...s.p } : {},
    }
}

export function setSlice(save: MapProgressSaveV1, mapId: string, slice: MapProgressSliceV1): MapProgressSaveV1 {
    const nextMaps = { ...save.maps }
    const compact = compactSlice(slice)
    if (sliceCount(compact) === 0) {
        delete nextMaps[mapId]
    } else {
        nextMaps[mapId] = compact
    }
    return { version: 1, maps: nextMaps }
}

function compactSlice(slice: MapProgressSliceV1): MapProgressSliceV1 {
    const out: MapProgressSliceV1 = {}
    if (slice.q) {
        const q: Record<string, boolean> = {}
        for (const [k, v] of Object.entries(slice.q)) {
            if (v) q[k] = true
        }
        if (Object.keys(q).length) out.q = q
    }
    if (slice.c) {
        const c: Record<string, boolean> = {}
        for (const [k, v] of Object.entries(slice.c)) {
            if (v) c[k] = true
        }
        if (Object.keys(c).length) out.c = c
    }
    if (slice.l) {
        const l: Record<string, boolean> = {}
        for (const [k, v] of Object.entries(slice.l)) {
            if (v) l[k] = true
        }
        if (Object.keys(l).length) out.l = l
    }
    if (slice.p) {
        const p: Record<string, boolean> = {}
        for (const [k, v] of Object.entries(slice.p)) {
            if (v) p[k] = true
        }
        if (Object.keys(p).length) out.p = p
    }
    return out
}

export function toggleVisit(
    save: MapProgressSaveV1,
    mapId: string,
    kind: 'q' | 'c' | 'l' | 'p',
    key: string,
    visited: boolean
): MapProgressSaveV1 {
    const prev = getSlice(save, mapId)
    const bucket = { ...(prev[kind] ?? {}) }
    if (visited) bucket[key] = true
    else delete bucket[key]
    const nextSlice: MapProgressSliceV1 = { ...prev, [kind]: bucket }
    if (Object.keys(bucket).length === 0) {
        const { [kind]: _, ...rest } = nextSlice
        return setSlice(save, mapId, rest as MapProgressSliceV1)
    }
    return setSlice(save, mapId, nextSlice)
}

export function isVisited(save: MapProgressSaveV1, mapId: string, kind: 'q' | 'c' | 'l' | 'p', key: string): boolean {
    const slice = save.maps[mapId]
    if (!slice) return false
    return Boolean(slice[kind]?.[key])
}
