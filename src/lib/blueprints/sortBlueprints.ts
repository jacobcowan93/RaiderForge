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

export function blueprintDisplayName(b: NormalizedBlueprint): string {
    return b.trackerDisplayName ?? b.name
}

function displayName(b: NormalizedBlueprint): string {
    return blueprintDisplayName(b)
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
        default:
            return next
    }
}
