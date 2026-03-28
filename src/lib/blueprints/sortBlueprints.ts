import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import { raritySortKey } from '@/lib/blueprints/normalizeBlueprints'
import { blueprintGameOrderIndex } from '@/lib/blueprints/blueprintInGameOrder'

export type SortMode =
    | 'ingame_asc'
    | 'sheet_asc'
    | 'name_asc'
    | 'name_desc'
    | 'rarity_asc'
    | 'rarity_desc'
    | 'recent_desc'
    | 'recent_asc'

export function blueprintDisplayName(b: NormalizedBlueprint): string {
    return b.trackerDisplayName ?? b.name
}

function displayName(b: NormalizedBlueprint): string {
    return blueprintDisplayName(b)
}

function recentTimestamp(iso: string | null): number {
    if (iso == null || iso.trim() === '') return 0
    const t = Date.parse(iso)
    return Number.isFinite(t) ? t : 0
}

export function applyBlueprintSort(list: NormalizedBlueprint[], mode: SortMode): NormalizedBlueprint[] {
    const next = [...list]
    switch (mode) {
        case 'ingame_asc':
            return next.sort((a, b) => {
                const ia = blueprintGameOrderIndex(blueprintDisplayName(a))
                const ib = blueprintGameOrderIndex(blueprintDisplayName(b))
                if (ia !== ib) return ia - ib
                return displayName(a).localeCompare(displayName(b))
            })
        case 'sheet_asc':
            return next.sort((a, b) => {
                const ao = a.spreadsheetOrder ?? 99999
                const bo = b.spreadsheetOrder ?? 99999
                if (ao !== bo) return ao - bo
                return displayName(a).localeCompare(displayName(b))
            })
        case 'name_asc':
            return next.sort((a, b) => displayName(a).localeCompare(displayName(b)))
        case 'name_desc':
            return next.sort((a, b) => displayName(b).localeCompare(displayName(a)))
        case 'rarity_asc':
            return next.sort((a, b) => {
                const d = raritySortKey(a.rarity) - raritySortKey(b.rarity)
                return d !== 0 ? d : displayName(a).localeCompare(displayName(b))
            })
        case 'rarity_desc':
            return next.sort((a, b) => {
                const d = raritySortKey(b.rarity) - raritySortKey(a.rarity)
                return d !== 0 ? d : displayName(a).localeCompare(displayName(b))
            })
        case 'recent_desc': {
            return next.sort((a, b) => {
                const ta = recentTimestamp(a.ardbUpdatedAt)
                const tb = recentTimestamp(b.ardbUpdatedAt)
                const ua = ta === 0 ? 1 : 0
                const ub = tb === 0 ? 1 : 0
                if (ua !== ub) return ua - ub
                if (ta !== tb) return tb - ta
                return displayName(a).localeCompare(displayName(b))
            })
        }
        case 'recent_asc': {
            return next.sort((a, b) => {
                const ta = recentTimestamp(a.ardbUpdatedAt)
                const tb = recentTimestamp(b.ardbUpdatedAt)
                const ua = ta === 0 ? 1 : 0
                const ub = tb === 0 ? 1 : 0
                if (ua !== ub) return ua - ub
                if (ta !== tb) return ta - tb
                return displayName(a).localeCompare(displayName(b))
            })
        }
        default:
            return next
    }
}
