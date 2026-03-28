import type { GameProject } from '../types'
import { asBoolean, asString, pickLocalized } from './common'

export function normalizeGameProject(raw: unknown): GameProject | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const id = asString(r.id)
    if (!id) return null
    return {
        id,
        name: pickLocalized(r.name, id),
        description: pickLocalized(r.description, '') || null,
        disabled: asBoolean(r.disabled, false),
    }
}
