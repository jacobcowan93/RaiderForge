'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'raiderforge.last-synced.v1'

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs  < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

export function SyncStatusBadge() {
    const [syncedAt, setSyncedAt] = useState<string | null>(null)

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) setSyncedAt(stored)
    }, [])

    return (
        <Link
            href="/sync"
            className="inline-flex items-center gap-1.5 text-[10px] font-semibold rounded-md px-2.5 py-1
                       border transition-all hover:bg-white/[0.04]"
            style={syncedAt ? {
                borderColor: 'rgba(52,211,153,0.20)',
                color:       'rgba(52,211,153,0.70)',
            } : {
                borderColor: 'rgba(255,255,255,0.10)',
                color:       'rgba(255,255,255,0.35)',
            }}
            title={syncedAt ? `Last synced ${new Date(syncedAt).toLocaleString()}` : 'Sync your profile'}
        >
            {syncedAt ? (
                <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Synced {timeAgo(syncedAt)}
                </>
            ) : (
                <>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                    Sync profile
                </>
            )}
        </Link>
    )
}
