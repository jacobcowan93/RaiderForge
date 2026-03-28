'use client'

/**
 * useEventsSchedule.ts
 *
 * Client-side hook that fetches live ARC Raiders events via our /api/events proxy
 * (MetaForge /events-schedule server-side). Parses cache metadata headers.
 *
 * Poll interval ~90s — aligns with 60s API revalidate without hammering origin.
 */

import { useState, useEffect, useCallback } from 'react'
import type { MfEvent } from '../lib/events/conditions'

const POLL_INTERVAL_MS = 90 * 1000

type State = {
    events: MfEvent[]
    loading: boolean
    error: string | null
    /** ISO time from X-Events-Fetched-At when present */
    fetchedAt: string | null
    /** X-Events-Upstream-Ok === "1" */
    upstreamOk: boolean | null
}

export function useEventsSchedule(): State & { refresh: () => void } {
    const [state, setState] = useState<State>({
        events: [],
        loading: true,
        error: null,
        fetchedAt: null,
        upstreamOk: null,
    })

    const fetchEvents = useCallback(async () => {
        setState((s) => ({
            ...s,
            loading: s.events.length === 0,
            error: null,
        }))
        try {
            const res = await fetch('/api/events', { cache: 'no-store' })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data: MfEvent[] = await res.json()
            const fetchedAt = res.headers.get('X-Events-Fetched-At')
            const upstreamOk = res.headers.get('X-Events-Upstream-Ok') === '1'
            setState({
                events: Array.isArray(data) ? data : [],
                loading: false,
                error: null,
                fetchedAt,
                upstreamOk,
            })
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error'
            console.warn('[useEventsSchedule] Fetch failed — falling back to rotation:', msg)
            setState({
                events: [],
                loading: false,
                error: msg,
                fetchedAt: null,
                upstreamOk: false,
            })
        }
    }, [])

    useEffect(() => {
        fetchEvents()
        const id = setInterval(fetchEvents, POLL_INTERVAL_MS)
        return () => clearInterval(id)
    }, [fetchEvents])

    return { ...state, refresh: fetchEvents }
}
