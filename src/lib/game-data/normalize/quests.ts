import type { GameQuest, GameQuestReward } from '../types'
import { asNumber, asString, asStringArray, pickLocalized } from './common'

/**
 * Each element of the objectives array IS a localized object:
 *   { en: "Find and search any ARC Probe", da: "...", ... }
 * (Not a nested { text: {...} } wrapper.)
 */
function extractObjectives(raw: unknown): string[] {
    if (!Array.isArray(raw) || raw.length === 0) return []
    const out: string[] = []
    for (const o of raw) {
        const text = pickLocalized(o, '')
        if (text) out.push(text)
    }
    return out
}

/**
 * rewardItemIds from arcdata: [{ itemId: "metal_parts", quantity: 10 }, …]
 */
function extractRewards(raw: unknown): GameQuestReward[] {
    if (!Array.isArray(raw)) return []
    const out: GameQuestReward[] = []
    for (const r of raw) {
        if (!r || typeof r !== 'object') continue
        const rr = r as Record<string, unknown>
        const itemId = asString(rr.itemId ?? rr.item_id)
        const quantity = asNumber(rr.quantity) ?? 1
        if (itemId) out.push({ itemId, quantity })
    }
    return out
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
        objectives: extractObjectives(r.objectives),
        rewards: extractRewards(r.rewardItemIds ?? r.reward_item_ids),
        previousQuestIds: asStringArray(r.previousQuestIds ?? r.previous_quest_ids),
        nextQuestIds: asStringArray(r.nextQuestIds ?? r.next_quest_ids),
    }
}
