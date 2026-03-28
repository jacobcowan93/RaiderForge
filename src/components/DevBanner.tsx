'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'rf-dev-banner-dismissed-v1'

function envAllowsBanner(): boolean {
    const v = process.env.NEXT_PUBLIC_SHOW_DEV_BANNER
    if (v === '0' || v === 'false') return false
    if (v === '1' || v === 'true') return true
    return process.env.NODE_ENV === 'development'
}

export default function DevBanner() {
    const [dismissed, setDismissed] = useState(true)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        try {
            setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
        } catch {
            setDismissed(false)
        }
    }, [])

    const dismiss = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, '1')
        } catch {
            /* ignore */
        }
        setDismissed(true)
    }, [])

    if (!mounted || !envAllowsBanner() || dismissed) return null

    return (
        <div
            className="fixed top-16 left-0 right-0 z-[44] flex items-center justify-center gap-3 border-b border-amber-500/25
                       bg-gradient-to-r from-amber-950/95 via-zinc-950/98 to-amber-950/95 px-4 py-2 text-center shadow-lg shadow-black/40"
            role="status"
        >
            <p className="text-[11px] sm:text-xs text-amber-100/90 leading-snug">
                <span className="font-semibold text-amber-200">RaiderForge is in active development.</span>{' '}
                Maps and tools are live; more features ship regularly.{' '}
                <a
                    href="https://discord.gg/raiderforge"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-300 underline underline-offset-2 hover:text-white transition-colors"
                >
                    Join Discord
                </a>
                {' '}for updates.
            </p>
            <button
                type="button"
                onClick={dismiss}
                className="shrink-0 rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70
                           hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Dismiss banner"
            >
                Dismiss
            </button>
        </div>
    )
}
