import type { BlueprintAllowlistEntry } from '@/lib/blueprints/blueprintSpreadsheetMatcher'
import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'

const PLACEHOLDER_ID_PREFIX = 'allowlist-placeholder:'

/**
 * Allowlist rows with no safe catalog match still participate in the tracker: stable id for
 * localStorage, spreadsheet fields only, no invented ARDB metadata.
 */
export function placeholderBlueprintFromAllowlistEntry(entry: BlueprintAllowlistEntry): NormalizedBlueprint {
    return {
        id: `${PLACEHOLDER_ID_PREFIX}${entry.order}`,
        name: entry.name,
        trackerDisplayName: entry.name,
        spreadsheetType: entry.type?.trim() || null,
        spreadsheetOrder: entry.order,
        description: null,
        rarity: null,
        itemType: 'blueprint',
        foundIn: [],
        iconUrl: null,
        imageUrl: null,
        sourceImageUrls: [],
        craftedItemIconUrl: null,
        craftingIngredients: [],
        ardbUpdatedAt: null,
    }
}

export function isAllowlistPlaceholderBlueprint(b: NormalizedBlueprint): boolean {
    return b.id.startsWith(PLACEHOLDER_ID_PREFIX)
}

/**
 * One row per allowlist entry, spreadsheet order. Matched rows keep catalog metadata;
 * unmatched rows become placeholders (reference art may still resolve by display name).
 */
export function mergeAllowlistMatchedBlueprints(
    matched: NormalizedBlueprint[],
    allowlistEntries: readonly BlueprintAllowlistEntry[]
): NormalizedBlueprint[] {
    const byTrackerName = new Map<string, NormalizedBlueprint>()
    for (const b of matched) {
        const key = b.trackerDisplayName?.trim()
        if (key) byTrackerName.set(key, b)
    }
    const out: NormalizedBlueprint[] = []
    for (const entry of allowlistEntries) {
        const existing = byTrackerName.get(entry.name)
        if (existing) out.push(existing)
        else out.push(placeholderBlueprintFromAllowlistEntry(entry))
    }
    return out
}
