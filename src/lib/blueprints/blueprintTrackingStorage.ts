export type BlueprintTrackState = 'not_owned' | 'owned' | 'tracking'

const STORAGE_KEY = 'raiderforge.blueprint-track.v1'

function isTrackState(v: unknown): v is BlueprintTrackState {
    return v === 'not_owned' || v === 'owned' || v === 'tracking'
}

export function loadBlueprintStates(): Record<string, BlueprintTrackState> {
    if (typeof window === 'undefined') return {}
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw) as unknown
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
        const out: Record<string, BlueprintTrackState> = {}
        for (const [k, v] of Object.entries(parsed)) {
            if (isTrackState(v)) out[k] = v
        }
        return out
    } catch {
        return {}
    }
}

export function saveBlueprintStates(map: Record<string, BlueprintTrackState>): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    } catch {
        /* ignore quota / private mode */
    }
}
