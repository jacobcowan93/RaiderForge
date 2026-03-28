const DEFAULT_TIMEOUT_MS = 12_000
const DEFAULT_REVALIDATE_SEC = 900

export class UpstreamGameDataError extends Error {
    constructor(
        message: string,
        readonly status?: number
    ) {
        super(message)
        this.name = 'UpstreamGameDataError'
    }
}

/**
 * Server-side JSON fetch with timeout and Next.js ISR-style revalidation hint.
 */
export async function fetchUpstreamJson<T>(
    url: string,
    options?: {
        timeoutMs?: number
        revalidateSeconds?: number
    }
): Promise<T> {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const revalidateSeconds = options?.revalidateSeconds ?? DEFAULT_REVALIDATE_SEC

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), timeoutMs)

    try {
        const res = await fetch(url, {
            method: 'GET',
            signal: ctrl.signal,
            headers: { Accept: 'application/json' },
            next: { revalidate: revalidateSeconds },
        })

        if (!res.ok) {
            const snippet = (await res.text().catch(() => '')).slice(0, 240)
            throw new UpstreamGameDataError(
                `HTTP ${res.status}${snippet ? `: ${snippet}` : ''}`,
                res.status
            )
        }

        return (await res.json()) as T
    } catch (e) {
        if (e instanceof UpstreamGameDataError) throw e
        if (e instanceof Error && e.name === 'AbortError') {
            throw new UpstreamGameDataError(`Request timed out after ${timeoutMs}ms`)
        }
        throw new UpstreamGameDataError(e instanceof Error ? e.message : 'Unknown fetch error')
    } finally {
        clearTimeout(timer)
    }
}
