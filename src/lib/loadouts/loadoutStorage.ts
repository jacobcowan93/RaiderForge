import type { LoadoutItemRef, LoadoutPersistedV1, LoadoutSlotId } from './loadoutTypes'

const STORAGE_KEY = 'raiderforge.loadout-builder.v1'

export function loadLoadoutFromStorage(): LoadoutPersistedV1 | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const data = JSON.parse(raw) as unknown
        if (!data || typeof data !== 'object') return null
        const o = data as Record<string, unknown>
        if (o.v !== 1 || typeof o.name !== 'string' || typeof o.slots !== 'object' || o.slots === null)
            return null
        return {
            v: 1,
            name: o.name,
            slots: o.slots as Partial<Record<LoadoutSlotId, LoadoutItemRef>>,
        }
    } catch {
        return null
    }
}

export function saveLoadoutToStorage(payload: LoadoutPersistedV1): void {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
        /* quota / private mode */
    }
}
