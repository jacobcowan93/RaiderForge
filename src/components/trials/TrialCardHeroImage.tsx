'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'

/** Shipped under `public/images/trials/` — guaranteed fallbacks if remote/local primary fails. */
const TRIAL_LOCAL_FALLBACK_CHAIN = [
    '/images/trials/hornet-havoc.svg',
    '/images/trials/bombardier-siege.svg',
    '/images/trials/flying-arc-hunt.svg',
] as const

function normalizeTrialCardSrc(raw: string | undefined): string {
    const s = (raw ?? '').trim()
    if (!s) return TRIAL_LOCAL_FALLBACK_CHAIN[0]
    if (s.startsWith('//')) return `https:${s}`
    if (/^https?:\/\//i.test(s)) return s
    if (s.startsWith('/')) return s
    return `/${s.replace(/^\/+/, '')}`
}

type Props = {
    src: string
    alt: string
    className?: string
}

/**
 * Hero strip for trial cards — MetaForge CDN, local `/images/trials/`, or zone thumbs.
 * Uses Next/Image with `unoptimized` for remote + SVG so the optimizer never blocks loads.
 */
export function TrialCardHeroImage({ src, alt, className }: Props) {
    const candidates = useMemo(() => {
        const primary = normalizeTrialCardSrc(src)
        const rest = TRIAL_LOCAL_FALLBACK_CHAIN.filter((p) => p !== primary)
        return [primary, ...rest]
    }, [src])

    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        setAttempt(0)
    }, [src])

    const displaySrc = candidates[Math.min(attempt, candidates.length - 1)]!
    const unoptimized =
        displaySrc.endsWith('.svg') || /^https?:\/\//i.test(displaySrc) || displaySrc.includes('%20')

    return (
        <Image
            key={`${displaySrc}-${attempt}`}
            src={displaySrc}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 20vw"
            className={`absolute inset-0 z-0 h-full w-full object-cover ${className ?? ''}`}
            unoptimized={unoptimized}
            onError={() => setAttempt((a) => Math.min(a + 1, candidates.length - 1))}
            priority={false}
        />
    )
}
