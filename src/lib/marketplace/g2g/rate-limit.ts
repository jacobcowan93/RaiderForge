import 'server-only'

/**
 * Simple global pacing for outbound G2G calls (one seller integration per deploy).
 */
export function createRequestPacer(minIntervalMs: number) {
    let chain: Promise<void> = Promise.resolve()
    let lastEnd = 0

    return function pace<T>(run: () => Promise<T>): Promise<T> {
        const next = chain.then(async () => {
            const now = Date.now()
            const wait = Math.max(0, minIntervalMs - (now - lastEnd))
            if (wait > 0) await new Promise((r) => setTimeout(r, wait))
            try {
                return await run()
            } finally {
                lastEnd = Date.now()
            }
        })
        chain = next.then(
            () => undefined,
            () => undefined
        )
        return next as Promise<T>
    }
}
