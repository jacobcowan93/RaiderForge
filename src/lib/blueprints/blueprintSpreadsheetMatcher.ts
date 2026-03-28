/**
 * Allowlist rows are vendored from `blueprint-allowlist.json` (generated from
 * “ARC Raiders Blueprints 74.xlsx”: column D = name, E = type). Re-export the
 * sheet with openpyxl/pandas and overwrite that JSON when the spreadsheet changes.
 */
import allowlistFile from '@/lib/blueprints/data/blueprint-allowlist.json'
import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'

export type BlueprintAllowlistEntry = {
    order: number
    sheetRow: number
    name: string
    type: string
}

type AllowlistJson = {
    version: number
    source: string
    entries: BlueprintAllowlistEntry[]
}

const allowlist = allowlistFile as AllowlistJson

/**
 * Explicit spreadsheet row (exact xlsx `Blueprints` cell) → catalog `name` as returned by ARDB.
 * Only for cases where normalized base-name matching is unsafe or insufficient (typos, alternate labels).
 * Do not use fuzzy logic — each entry is a deliberate pairing.
 */
const SPREADSHEET_TO_EXACT_CATALOG_NAME: Record<string, string> = {
    'Aphelion Rifle': 'Aphelion Blueprint',
    "El' Toro": 'Il Toro Blueprint',
    'Firework Box': 'Fireworks Box Blueprint',
    Jupitar: 'Jupiter Blueprint',
    Torrentte: 'Torrente Blueprint',
    'Trailblazer Grenade': 'Trailblazer Blueprint',
}

/** Strip trailing "Blueprint" from ARDB recipe titles for comparison. */
export function stripBlueprintSuffix(name: string): string {
    return name.replace(/\s+blueprint\s*$/i, '').trim()
}

/**
 * Conservative key: NFKC, trim, collapse spaces, lower, unify apostrophe-like chars.
 * No fuzzy substring matching — equality only on this key.
 */
export function normalizeBlueprintMatchKey(name: string): string {
    const base = stripBlueprintSuffix(name)
    return base
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035`´]/g, "'")
}

export function getBlueprintAllowlistEntries(): BlueprintAllowlistEntry[] {
    return allowlist.entries
}

export type SpreadsheetMatchStats = {
    allowlistRowCount: number
    matchedCount: number
    /** Spreadsheet `Blueprints` values with no catalog row (after aliases + normalized match). */
    unmatchedSheetNames: string[]
    /** Catalog blueprint items not on the spreadsheet allowlist (e.g. extra ARDB recipes). */
    excludedCatalogNames: string[]
}

export type MatchBlueprintsToAllowlistResult = {
    blueprints: NormalizedBlueprint[]
    stats: SpreadsheetMatchStats
}

/**
 * Intersects ARDB blueprint rows with the spreadsheet allowlist.
 * - Preserves catalog metadata on each row; sets `trackerDisplayName`, `spreadsheetType`, `spreadsheetOrder` from the sheet.
 * - Order in `blueprints` follows spreadsheet `order`.
 */
export function matchBlueprintsToAllowlist(catalogBlueprints: NormalizedBlueprint[]): MatchBlueprintsToAllowlistResult {
    const byExactCatalogName = new Map<string, NormalizedBlueprint>()
    const byNormKey = new Map<string, NormalizedBlueprint[]>()

    for (const b of catalogBlueprints) {
        byExactCatalogName.set(b.name, b)
        const k = normalizeBlueprintMatchKey(b.name)
        const arr = byNormKey.get(k)
        if (arr) arr.push(b)
        else byNormKey.set(k, [b])
    }

    const matchedCatalogIds = new Set<string>()
    const matched: NormalizedBlueprint[] = []
    const unmatchedSheetNames: string[] = []

    for (const entry of allowlist.entries) {
        const aliasName = SPREADSHEET_TO_EXACT_CATALOG_NAME[entry.name]
        let catalogBp: NormalizedBlueprint | null = null

        if (aliasName) {
            catalogBp = byExactCatalogName.get(aliasName) ?? null
        }

        if (!catalogBp) {
            const k = normalizeBlueprintMatchKey(entry.name)
            const hits = byNormKey.get(k)
            if (hits?.length === 1) catalogBp = hits[0]!
            else if (hits && hits.length > 1) {
                catalogBp = [...hits].sort((a, b) => a.id.localeCompare(b.id))[0]!
            }
        }

        if (!catalogBp) {
            unmatchedSheetNames.push(entry.name)
            continue
        }

        if (matchedCatalogIds.has(catalogBp.id)) {
            unmatchedSheetNames.push(entry.name)
            continue
        }

        matchedCatalogIds.add(catalogBp.id)
        matched.push({
            ...catalogBp,
            trackerDisplayName: entry.name,
            spreadsheetType: entry.type?.trim() || null,
            spreadsheetOrder: entry.order,
        })
    }

    const excludedCatalogNames: string[] = []
    for (const b of catalogBlueprints) {
        if (!matchedCatalogIds.has(b.id)) excludedCatalogNames.push(b.name)
    }
    excludedCatalogNames.sort((a, b) => a.localeCompare(b))

    return {
        blueprints: matched,
        stats: {
            allowlistRowCount: allowlist.entries.length,
            matchedCount: matched.length,
            unmatchedSheetNames,
            excludedCatalogNames,
        },
    }
}

/** `console.warn` in development for allowlist drift review. */
export function logSpreadsheetMatchStats(stats: SpreadsheetMatchStats): void {
    if (process.env.NODE_ENV !== 'development') return
    if (stats.unmatchedSheetNames.length > 0) {
        console.warn(
            '[blueprints] Spreadsheet rows with no safe catalog match:',
            stats.unmatchedSheetNames
        )
    }
    if (stats.excludedCatalogNames.length > 0) {
        console.warn('[blueprints] Catalog blueprints excluded by spreadsheet allowlist:', stats.excludedCatalogNames)
    }
}
