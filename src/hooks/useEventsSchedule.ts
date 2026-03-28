'use client'

/**
 * useEventsSchedule.ts
 *
 * Client-side hook that fetches live ARC Raiders events via our /api/events proxy
 * (which calls MetaForge /events-schedule server-side).
 *
 * Refreshes every 5 minutes. Falls back gracefully on error.
 */

import { useState, useEffect, useCallback } from 'react'
import type { MfEvent } from '../lib/events/conditions'

const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

type State = {
  events: MfEvent[]
  loading: boolean
  error: string | null
}

export function useEventsSchedule(): State & { refresh: () => void } {
  const [state, setState] = useState<State>({ events: [], loading: true, error: null })

  const fetchEvents = useCallback(async () => {
    setState(s => ({
      ...s,
      // Avoid flashing the panel skeleton on the 5‑minute poll when we already have data.
      loading: s.events.length === 0,
      error: null,
    }))
    try {
      const res = await fetch('/api/events', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: MfEvent[] = await res.json()
      setState({ events: Array.isArray(data) ? data : [], loading: false, error: null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.warn('[useEventsSchedule] Fetch failed — falling back to rotation:', msg)
      setState({ events: [], loading: false, error: msg })
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const id = setInterval(fetchEvents, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchEvents])

  return { ...state, refresh: fetchEvents }
}
