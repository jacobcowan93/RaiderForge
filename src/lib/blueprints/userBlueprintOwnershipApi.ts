import type { BlueprintTrackState } from '@/lib/blueprints/blueprintTrackingStorage'

const VALID: BlueprintTrackState[] = ['owned', 'not_owned', 'tracking']

const MAX_KEYS = 200
const MAX_BLUEPRINT_ID_LEN = 128

function isTrackState(v: unknown): v is BlueprintTrackState {
    return typeof v === 'string' && (VALID as string[]).includes(v)
}

export type ParsedBlueprintOwnership =
    | { ok: true; entries: Record<string, BlueprintTrackState> }
    | { ok: false; error: string }

/** Parse and validate POST body `{ entries: Record<string, BlueprintTrackState> }`. */
export function parseBlueprintOwnershipEntries(body: unknown): ParsedBlueprintOwnership {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return { ok: false, error: 'Body must be a JSON object.' }
    }
    const entries = (body as { entries?: unknown }).entries
    if (entries === null || typeof entries !== 'object' || Array.isArray(entries)) {
        return { ok: false, error: 'Missing or invalid "entries" object.' }
    }
    const raw = entries as Record<string, unknown>
    const keys = Object.keys(raw)
    if (keys.length > MAX_KEYS) {
        return { ok: false, error: `At most ${MAX_KEYS} blueprint entries per request.` }
    }
    const out: Record<string, BlueprintTrackState> = {}
    for (const [id, state] of Object.entries(raw)) {
        const trimmedId = id.trim()
        if (!trimmedId || trimmedId.length > MAX_BLUEPRINT_ID_LEN) {
            return { ok: false, error: `Invalid blueprint id: ${id.slice(0, 40)}…` }
        }
        if (!isTrackState(state)) {
            return { ok: false, error: `Invalid state for blueprint "${trimmedId}".` }
        }
        if (state === 'not_owned') {
            continue
        }
        out[trimmedId] = state
    }
    return { ok: true, entries: out }
}
