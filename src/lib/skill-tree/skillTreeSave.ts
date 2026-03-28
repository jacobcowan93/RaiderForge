/** Persisted skill tree build — keep in sync with API + localStorage. */
export type SkillTreeSaveV1 = {
    version: 1
    /** Points allocated per `GameSkillNode.id` (omit or 0 = none). */
    allocations: Record<string, number>
}

export const SKILL_TREE_SAVE_VERSION = 1 as const

export function emptySkillTreeSave(): SkillTreeSaveV1 {
    return { version: 1, allocations: {} }
}

export function clampAllocationForNode(points: number, maxPoints: number | null): number {
    const n = Math.floor(Number.isFinite(points) ? points : 0)
    const cap = maxPoints != null && maxPoints > 0 ? Math.min(maxPoints, 99) : 1
    return Math.min(cap, Math.max(0, n))
}
