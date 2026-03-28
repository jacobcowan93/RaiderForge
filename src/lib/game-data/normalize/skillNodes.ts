import type { GameSkillNode } from '../types'
import { asBoolean, asNumber, asString, pickLocalized } from './common'

export function normalizeGameSkillNode(raw: unknown): GameSkillNode | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const id = asString(r.id)
    if (!id) return null
    const impacted = r.impactedSkill
    let impactedSkill: string | null = null
    if (impacted != null && typeof impacted === 'object') {
        impactedSkill = pickLocalized(impacted, '') || null
    } else {
        impactedSkill = asString(impacted)
    }
    return {
        id,
        name: pickLocalized(r.name, id),
        category: asString(r.category),
        description: pickLocalized(r.description, '') || null,
        isMajor: asBoolean(r.isMajor, false),
        maxPoints: asNumber(r.maxPoints ?? r.max_points),
        impactedSkill,
    }
}
