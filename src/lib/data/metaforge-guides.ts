/**
 * Server-only snapshot of MetaForge ARC Raiders data useful for the Guides hub.
 * Endpoints: GET https://metaforge.app/api/arc-raiders/arcs | /quests
 * (via @/api/metaforgeService — no browser calls to MetaForge.)
 */

import { fetchMfArcs, fetchMfQuests } from '@/api/metaforgeService'
import type { MfQuestRaw } from '@/types/quests'

export type MetaforgeArcPreview = {
    id?: string
    name?: string
    descriptionSnippet?: string
}

export type MetaforgeQuestPreview = {
    id: string
    name: string
    objectivesPreview?: string[]
}

export type MetaforgeGuidesSnapshot = {
    arcs: MetaforgeArcPreview[]
    quests: MetaforgeQuestPreview[]
    /** False if any fetch threw (snapshot may be empty). */
    ok: boolean
}

function clip(s: string, max: number): string {
    const t = s.trim()
    if (t.length <= max) return t
    return `${t.slice(0, max - 1)}…`
}

/**
 * Pulls a small, safe preview of arcs/quests for the Guides landing page.
 * Triweekly-style content on MetaForge is summarized here; full detail stays on their site.
 */
export async function fetchMetaforgeGuidesSnapshot(): Promise<MetaforgeGuidesSnapshot> {
    try {
        const [arcs, quests] = await Promise.all([
            fetchMfArcs(),
            fetchMfQuests(),
        ])

        const arcPreviews: MetaforgeArcPreview[] = arcs.slice(0, 8).map((a) => ({
            id: typeof a.id === 'string' ? a.id : undefined,
            name: typeof a.name === 'string' ? a.name : undefined,
            descriptionSnippet:
                typeof a.description === 'string' && a.description.length > 0
                    ? clip(a.description, 220)
                    : undefined,
        }))

        const questPreviews: MetaforgeQuestPreview[] = (quests as MfQuestRaw[]).slice(0, 10).map((q) => ({
            id: q.id,
            name: q.name,
            objectivesPreview: Array.isArray(q.objectives) ? q.objectives.slice(0, 3) : undefined,
        }))

        return {
            arcs: arcPreviews.filter((a) => a.name),
            quests: questPreviews,
            ok: true,
        }
    } catch (e) {
        console.warn('[metaforge-guides] snapshot failed', e)
        return { arcs: [], quests: [], ok: false }
    }
}
