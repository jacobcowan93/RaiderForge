import referenceFile from '@/lib/blueprints/data/blueprint-reference-artifacts.json'
import { blueprintLookupKey } from '@/lib/blueprints/blueprintSlug'

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

/**
 * Prefix for static files when the app is served under `basePath` (must match `next.config` and be exposed as
 * `NEXT_PUBLIC_BASE_PATH`, e.g. `/RaiderForge`). Omit or leave empty for root hosting (typical Vercel custom domain).
 */
export function normalizePublicAssetUrl(path: string): string {
    const trimmed = path.trim()
    if (!trimmed) return trimmed
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')
    if (!base) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    const p = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return `${base}${p}`
}

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
