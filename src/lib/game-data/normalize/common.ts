/** Pick a display string from RaidTheory-style localized objects (prefer en). */
export function pickLocalized(value: unknown, fallback = ''): string {
    if (value == null) return fallback
    if (typeof value === 'string') return value.trim() || fallback
    if (typeof value === 'object' && !Array.isArray(value)) {
        const o = value as Record<string, unknown>
        const en = o.en
        if (typeof en === 'string' && en.trim()) return en.trim()
        for (const v of Object.values(o)) {
            if (typeof v === 'string' && v.trim()) return v.trim()
        }
    }
    return fallback
}

export function asString(v: unknown): string | null {
    if (v == null) return null
    if (typeof v === 'string') return v.trim() || null
    if (typeof v === 'number' && Number.isFinite(v)) return String(v)
    return null
}

export function asNumber(v: unknown): number | null {
    if (v == null) return null
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v)
        return Number.isFinite(n) ? n : null
    }
    return null
}

export function asBoolean(v: unknown, defaultValue = false): boolean {
    if (typeof v === 'boolean') return v
    return defaultValue
}

export function asStringArray(v: unknown): string[] {
    if (!Array.isArray(v)) return []
    const out: string[] = []
    for (const x of v) {
        const s = asString(x)
        if (s) out.push(s)
    }
    return out
}
