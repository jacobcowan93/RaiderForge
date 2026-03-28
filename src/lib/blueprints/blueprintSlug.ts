/** Stable slug for registry keys (matches `scripts/extract-blueprint-reference-grid.py`). */
export function blueprintLookupKey(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/** Display-only: remove trailing " Blueprint" (case-insensitive), not mid-string matches. */
export function stripTrailingBlueprintSuffix(label: string): string {
    return label.replace(/\s+blueprint\s*$/i, '').trim()
}
