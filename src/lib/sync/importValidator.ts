import type { RaiderForgeImportV1 } from './importTypes'
import { IMPORT_FORMAT_VERSION } from './importTypes'

const MAX_BLUEPRINTS = 2000
const MAX_SKILL_NODES = 500
const MAX_POINTS_PER_NODE = 20

export type ParseResult =
    | { ok: true; data: RaiderForgeImportV1; warnings: string[] }
    | { ok: false; error: string }

/**
 * Parses and validates a raw JSON value as a RaiderForgeImportV1 payload.
 * Returns structured errors the UI can display directly to the user.
 */
export function parseImportPayload(raw: unknown): ParseResult {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ok: false, error: 'Import file must be a JSON object.' }
    }

    const obj = raw as Record<string, unknown>

    // Version check
    if (obj.version !== IMPORT_FORMAT_VERSION) {
        return {
            ok: false,
            error: `Unsupported import version: ${String(obj.version ?? 'missing')}. Expected ${IMPORT_FORMAT_VERSION}.`,
        }
    }

    const warnings: string[] = []

    // ── Blueprints ─────────────────────────────────────────────────────────────
    let blueprints: RaiderForgeImportV1['blueprints'] | undefined
    if (obj.blueprints !== undefined) {
        const bp = obj.blueprints as Record<string, unknown>
        if (!bp || typeof bp !== 'object' || Array.isArray(bp)) {
            return { ok: false, error: '"blueprints" must be an object.' }
        }
        if (!Array.isArray(bp.owned)) {
            return { ok: false, error: '"blueprints.owned" must be an array of item IDs.' }
        }

        const owned: string[] = []
        for (const entry of bp.owned) {
            if (typeof entry !== 'string' || !entry.trim()) continue
            owned.push(entry.trim())
        }

        if (owned.length > MAX_BLUEPRINTS) {
            warnings.push(`Blueprint list truncated to ${MAX_BLUEPRINTS} entries.`)
            owned.splice(MAX_BLUEPRINTS)
        }

        blueprints = { owned }
    }

    // ── Skill tree ────────────────────────────────────────────────────────────
    let skillTree: RaiderForgeImportV1['skillTree'] | undefined
    if (obj.skillTree !== undefined) {
        const st = obj.skillTree as Record<string, unknown>
        if (!st || typeof st !== 'object' || Array.isArray(st)) {
            return { ok: false, error: '"skillTree" must be an object.' }
        }
        if (typeof st.version !== 'number') {
            return { ok: false, error: '"skillTree.version" must be a number.' }
        }
        if (!st.allocations || typeof st.allocations !== 'object' || Array.isArray(st.allocations)) {
            return { ok: false, error: '"skillTree.allocations" must be an object.' }
        }

        const raw = st.allocations as Record<string, unknown>
        const allocations: Record<string, number> = {}
        let nodeCount = 0

        for (const [key, val] of Object.entries(raw)) {
            if (nodeCount >= MAX_SKILL_NODES) {
                warnings.push(`Skill tree truncated to ${MAX_SKILL_NODES} nodes.`)
                break
            }
            const points = typeof val === 'number' ? val : Number(val)
            if (!Number.isFinite(points) || points < 0) continue
            allocations[key] = Math.min(Math.floor(points), MAX_POINTS_PER_NODE)
            nodeCount++
        }

        skillTree = { version: st.version as number, allocations }
    }

    if (!blueprints && !skillTree) {
        warnings.push('No data sections found (blueprints, skillTree). Import will have no effect.')
    }

    return {
        ok: true,
        data: {
            version: 1,
            source: (obj.source === 'raiderforge_export' ? 'raiderforge_export' : 'manual') as RaiderForgeImportV1['source'],
            exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : undefined,
            blueprints,
            skillTree,
        },
        warnings,
    }
}
