import type { SkillTreeSaveV1 } from '@/lib/skill-tree/skillTreeSave'
import { emptySkillTreeSave, SKILL_TREE_SAVE_VERSION } from '@/lib/skill-tree/skillTreeSave'

const MAX_ALLOCATION_KEYS = 600
const MAX_POINTS_PER_NODE = 99

export type ParsedSkillTreeSave = { ok: true; save: SkillTreeSaveV1 } | { ok: false; error: string }

export function parseSkillTreeSaveBody(body: unknown): ParsedSkillTreeSave {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return { ok: false, error: 'Body must be a JSON object.' }
    }
    const saveRaw = (body as { save?: unknown }).save
    if (saveRaw === null || typeof saveRaw !== 'object' || Array.isArray(saveRaw)) {
        return { ok: false, error: 'Missing or invalid "save" object.' }
    }
    const s = saveRaw as Record<string, unknown>
    if (s.version !== SKILL_TREE_SAVE_VERSION) {
        return { ok: false, error: `Unsupported save version (expected ${SKILL_TREE_SAVE_VERSION}).` }
    }
    const alloc = s.allocations
    if (alloc === null || typeof alloc !== 'object' || Array.isArray(alloc)) {
        return { ok: false, error: 'Invalid "allocations" object.' }
    }
    const keys = Object.keys(alloc as Record<string, unknown>)
    if (keys.length > MAX_ALLOCATION_KEYS) {
        return { ok: false, error: `At most ${MAX_ALLOCATION_KEYS} skill nodes per save.` }
    }
    const allocations: Record<string, number> = {}
    for (const [k, val] of Object.entries(alloc as Record<string, unknown>)) {
        const id = k.trim()
        if (!id || id.length > 128) {
            return { ok: false, error: 'Invalid skill node id in allocations.' }
        }
        const n = Math.floor(Number(val))
        if (!Number.isFinite(n) || n < 0 || n > MAX_POINTS_PER_NODE) {
            return { ok: false, error: `Invalid points for node "${id}".` }
        }
        if (n > 0) allocations[id] = n
    }
    return { ok: true, save: { version: 1, allocations } }
}

/** Coerce Prisma Json or API unknown into SkillTreeSaveV1. */
export function skillTreeSaveFromJson(json: unknown): SkillTreeSaveV1 {
    const parsed = parseSkillTreeSaveBody({ save: json })
    if (parsed.ok) return parsed.save
    return emptySkillTreeSave()
}
