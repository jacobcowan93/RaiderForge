import type { GameMap } from '../types'
import { asString, pickLocalized } from './common'
import { resolveGameDataImageUrl } from './imageUrl'

export function normalizeGameMap(raw: unknown): GameMap | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const id = asString(r.id)
    if (!id) return null
    const imageUrl = resolveGameDataImageUrl([
        asString(r.imageUrl),
        asString(r.image_url),
        asString(r.image),
        asString(r.thumbnail),
        asString(r.coverImage),
        asString(r.cover_image),
    ])
    return {
        id,
        name: pickLocalized(r.name, id),
        imageUrl,
    }
}
