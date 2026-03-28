import type { GameItem } from '../types'
import { asNumber, asString, pickLocalized } from './common'

export function normalizeGameItem(raw: unknown): GameItem | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const id = asString(r.id)
    if (!id) return null
    const name = pickLocalized(r.name, id)
    return {
        id,
        name,
        description: pickLocalized(r.description, '') || null,
        type: asString(r.type),
        rarity: asString(r.rarity),
        value: asNumber(r.value),
        weightKg: asNumber(r.weightKg ?? r.weight_kg),
        stackSize: asNumber(r.stackSize ?? r.stack_size),
        imageUrl: asString(r.imageFilename ?? r.image_filename ?? r.imageUrl ?? r.image),
        updatedAt: asString(r.updatedAt ?? r.updated_at),
    }
}
