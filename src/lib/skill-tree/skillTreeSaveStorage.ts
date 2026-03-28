import { emptySkillTreeSave, type SkillTreeSaveV1 } from '@/lib/skill-tree/skillTreeSave'

const STORAGE_KEY = 'raiderforge.skill-tree-save.v1'

function isV1Save(v: unknown): v is SkillTreeSaveV1 {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return false
    const o = v as Record<string, unknown>
    if (o.version !== 1) return false
    if (o.allocations === null || typeof o.allocations !== 'object' || Array.isArray(o.allocations)) return false
    return true
}

export function loadSkillTreeSave(): SkillTreeSaveV1 {
    if (typeof window === 'undefined') return emptySkillTreeSave()
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return emptySkillTreeSave()
        const parsed = JSON.parse(raw) as unknown
        if (!isV1Save(parsed)) return emptySkillTreeSave()
        const allocations: Record<string, number> = {}
        for (const [k, val] of Object.entries(parsed.allocations)) {
            const id = String(k).trim()
            if (!id) continue
            const n = Math.floor(Number(val))
            if (!Number.isFinite(n) || n <= 0) continue
            allocations[id] = n
        }
        return { version: 1, allocations }
    } catch {
        return emptySkillTreeSave()
    }
}

export function saveSkillTreeSave(save: SkillTreeSaveV1): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
    } catch {
        /* quota / private mode */
    }
}
