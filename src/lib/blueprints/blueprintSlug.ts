/** Stable slug for registry keys (matches `scripts/extract-blueprint-reference-grid.py`). */
export function blueprintLookupKey(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
