import type { GameMap } from '../types'
import { asString, pickLocalized } from './common'

export function normalizeGameMap(raw: unknown): GameMap | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const id = asString(r.id)
    if (!id) return null
    return {
        id,
        name: pickLocalized(r.name, id),
        imageUrl: asString(r.image),
    }
}
