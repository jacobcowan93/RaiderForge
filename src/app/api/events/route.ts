/**
 * /api/events — Server-side proxy for MetaForge /events-schedule.
 *
 * Keeps the upstream MetaForge request server-side (avoids CORS in browser).
 * Cached at the edge for 5 minutes via Cache-Control headers.
 */

import { fetchMfEventsSchedule } from '../../../api/metaforgeService'

export async function GET() {
  try {
    const events = await fetchMfEventsSchedule()
    return Response.json(events, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (err) {
    console.error('[/api/events] Failed:', err)
    return Response.json([], { status: 200 }) // return empty array — clients fall back to rotation
  }
}
