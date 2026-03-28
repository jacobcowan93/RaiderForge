import type { GameQuest } from '../types'
import { asNumber, asString, asStringArray, pickLocalized } from './common'

function summarizeObjectives(raw: unknown): string | null {
    if (!Array.isArray(raw) || raw.length === 0) return null
    const parts: string[] = []
    for (const o of raw) {
        if (!o || typeof o !== 'object') continue
        const obj = o as Record<string, unknown>
        const t = pickLocalized(obj.text ?? obj.description ?? obj.objective, '')
        if (t) parts.push(t)
    }
    if (parts.length === 0) return null
    return parts.slice(0, 5).join(' · ')
}

export function normalizeGameQuest(raw: unknown): GameQuest | null {
    if (!raw || typeof raw !== 'object') return null
    const r = raw as Record<string, unknown>
    const id = asString(r.id)
    if (!id) return null
    return {
        id,
        name: pickLocalized(r.name, id),
        description: pickLocalized(r.description, '') || null,
        traderName: asString(r.trader),
        xp: asNumber(r.xp),
        objectiveSummary: summarizeObjectives(r.objectives),
        rewardItemIds: asStringArray(r.rewardItemIds ?? r.reward_item_ids),
        previousQuestIds: asStringArray(r.previousQuestIds ?? r.previous_quest_ids),
        nextQuestIds: asStringArray(r.nextQuestIds ?? r.next_quest_ids),
    }
}
