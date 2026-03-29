import referenceFile from '@/lib/blueprints/data/blueprint-reference-artifacts.json'
import { blueprintLookupKey } from '@/lib/blueprints/blueprintSlug'
import { normalizePublicAssetUrl } from '@/lib/site/publicAssetUrl'

type ReferenceJson = {
    version: number
    source: string
    artifacts: Record<string, string>
}

const reference = referenceFile as ReferenceJson

/**
 * Spreadsheet / tracker display label → canonical name on the Speranza reference grid.
 * Only explicit, non-fuzzy pairings (typos / alternate labels).
 */
const SPREADSHEET_LABEL_TO_REFERENCE_NAME: Record<string, string> = {
    'Firework Box': 'Fireworks Box',
    "El' Toro": 'Il Toro',
    Jupitar: 'Jupiter',
    Torrentte: 'Torrente',
}

const artifacts = reference.artifacts

/** URL under `public/` for sliced reference art, or null if this label has no tile (e.g. Compensator III). */
export function resolveReferenceBlueprintArt(displayLabel: string): string | null {
    const trimmed = displayLabel?.trim()
    if (!trimmed) return null
    const refName = SPREADSHEET_LABEL_TO_REFERENCE_NAME[trimmed] ?? trimmed
    const key = blueprintLookupKey(refName)
    const url = artifacts[key]
    if (!url?.trim()) return null
    return normalizePublicAssetUrl(url)
}

export function getReferenceArtifactKeys(): string[] {
    return Object.keys(artifacts).sort()
}
