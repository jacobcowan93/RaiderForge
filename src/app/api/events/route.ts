/**
 * /api/events — Server-side proxy for MetaForge /events-schedule.
 *
 * Keeps the upstream MetaForge request server-side (avoids CORS in browser).
 * Short CDN cache + SWR for fresher live conditions.
 *
 * Headers:
 * - X-Events-Fetched-At: ISO time after upstream response
 * - X-Events-Upstream-Ok: "1" | "0" (network / parse success)
 */

import { fetchCurrentEvents } from '@/lib/data/metaforge-events'

export async function GET() {
    try {
        const { events, fetchedAt, upstreamOk } = await fetchCurrentEvents()
        if (process.env.NODE_ENV === 'development') {
            const n = events.length
            const fallback = !upstreamOk || n === 0
            console.info(
                `[live-events] upstreamOk=${upstreamOk} eventCount=${n} rotationFallback=${fallback ? 'yes' : 'no'}`,
            )
        }
        return Response.json(events, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                'X-Events-Fetched-At': fetchedAt,
                'X-Events-Upstream-Ok': upstreamOk ? '1' : '0',
            },
        })
    } catch (err) {
        console.error('[/api/events] Failed:', err)
        const fetchedAt = new Date().toISOString()
        if (process.env.NODE_ENV === 'development') {
            console.info('[live-events] upstreamOk=false eventCount=0 rotationFallback=yes (exception path)')
        }
        return Response.json([], {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
                'X-Events-Fetched-At': fetchedAt,
                'X-Events-Upstream-Ok': '0',
            },
        })
    }
}
