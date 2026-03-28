'use client'

import { useEffect, useState } from 'react'

import { bannerKeyForChip, deriveLiveDataChipKind } from '@/lib/live-data/feedState'
import { formatLocalTimestampFull, formatRelativeUpdated } from '@/lib/live-data/formatTimestamp'

import { LiveDataFeedBanner } from './LiveDataFeedBanner'
import { LiveDataStatusChip } from './LiveDataStatusChip'

const TICK_MS = 8_000

type Props = {
    fetchedAt: string | null
    upstreamOk: boolean | null
    polledEventCount: number
    loading: boolean
    className?: string
    /** When set (e.g. LivePanel 1s tick), chip/stale logic follows parent clock; no internal timer. */
    now?: Date
}

/**
 * Shared live-data header: status chip + relative updated time (title = full local) + contextual banner.
 */
export function LiveDataFeedStrip({
    fetchedAt,
    upstreamOk,
    polledEventCount,
    loading,
    className = '',
    now: nowProp,
}: Props) {
    const [tick, setTick] = useState(() => new Date())

    useEffect(() => {
        if (nowProp) return
        const id = setInterval(() => setTick(new Date()), TICK_MS)
        return () => clearInterval(id)
    }, [nowProp])

    const now = nowProp ?? tick

    const kind = deriveLiveDataChipKind({
        upstreamOk,
        fetchedAt,
        now,
        polledEventCount,
        loading,
    })
    const bannerKey = bannerKeyForChip(kind)
    const relative = formatRelativeUpdated(fetchedAt, now)
    const fullTs = fetchedAt ? formatLocalTimestampFull(fetchedAt) : null

    return (
        <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <LiveDataStatusChip kind={kind} />
                <span
                    className="tabular-nums text-[10px] sm:text-[11px] text-white/60 whitespace-nowrap shrink-0 min-w-[10ch] inline-block text-left sm:text-right"
                    title={fullTs ? `Schedule — ${fullTs}` : undefined}
                >
                    {relative}
                </span>
            </div>
            <LiveDataFeedBanner bannerKey={bannerKey} />
        </div>
    )
}
