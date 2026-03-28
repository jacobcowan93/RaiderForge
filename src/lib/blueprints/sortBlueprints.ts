import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import { raritySortKey } from '@/lib/blueprints/normalizeBlueprints'

export type SortMode = 'name_asc' | 'name_desc' | 'rarity_asc' | 'rarity_desc'

export function applyBlueprintSort(list: NormalizedBlueprint[], mode: SortMode): NormalizedBlueprint[] {
    const next = [...list]
    switch (mode) {
        case 'name_asc':
            return next.sort((a, b) => a.name.localeCompare(b.name))
        case 'name_desc':
            return next.sort((a, b) => b.name.localeCompare(a.name))
        case 'rarity_asc':
            return next.sort((a, b) => {
                const d = raritySortKey(a.rarity) - raritySortKey(b.rarity)
                return d !== 0 ? d : a.name.localeCompare(b.name)
            })
        case 'rarity_desc':
            return next.sort((a, b) => {
                const d = raritySortKey(b.rarity) - raritySortKey(a.rarity)
                return d !== 0 ? d : a.name.localeCompare(b.name)
            })
        default:
            return next
    }
}
