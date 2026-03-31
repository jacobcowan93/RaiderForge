/**
 * RaiderForge Profile Import — canonical format for manual JSON imports.
 *
 * Designed to be forward-compatible with a future Embark OAuth API response:
 * the same field names will be used when auto-sync lands.
 *
 * Version history:
 *   1 — initial (manual upload: blueprints + skill tree)
 */

export const IMPORT_FORMAT_VERSION = 1 as const

export type RaiderForgeImportV1 = {
    /** Always 1 for this version. */
    version: 1
    /** How the data was produced. "manual" = user-typed or copy-pasted. */
    source: 'manual' | 'raiderforge_export'
    /** ISO 8601 timestamp — when the player exported the data. Optional. */
    exportedAt?: string

    /**
     * Blueprint ownership list.
     * Each entry is an ARDB item ID (ardbId) matching the catalog.
     * Imported as state = "owned" in UserBlueprintOwnership.
     */
    blueprints?: {
        owned: string[]
    }

    /**
     * Skill tree point allocations.
     * Keys are skill node IDs; values are integer point counts.
     * Written directly to UserSkillTreeSave.payload.
     */
    skillTree?: {
        version: number
        allocations: Record<string, number>
    }
}

// ─── Result types ──────────────────────────────────────────────────────────────

export type ImportResult = {
    ok: true
    blueprintsImported: number
    skillTreeImported: boolean
    warnings: string[]
} | {
    ok: false
    error: string
}
