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
    /** `pill`: small 28×28 icon. `circle`: large badge-style circle. `banner`: fill parent. */
    variant?: 'banner' | 'pill' | 'circle'
}

/**
 * Trial card imagery — MetaForge CDN, local `/images/trials/`, or zone thumbs.
 * Uses Next/Image with `unoptimized` for remote + SVG so the optimizer never blocks loads.
 */
export function TrialCardHeroImage({ src, alt, className, variant = 'banner' }: Props) {
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

    if (variant === 'pill') {
        return (
            <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                <Image
                    key={`${displaySrc}-${attempt}`}
                    src={displaySrc}
                    alt={alt}
                    width={28}
                    height={28}
                    sizes="28px"
                    className={`h-7 w-7 object-cover object-center ${className ?? ''}`}
                    unoptimized={unoptimized}
                    onError={() => setAttempt((a) => Math.min(a + 1, candidates.length - 1))}
                    priority={false}
                />
            </div>
        )
    }

    if (variant === 'circle') {
        return (
            <div
                className={`mx-auto flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-black/70 shadow-[0_0_0_3px_rgba(255,255,255,0.85)] sm:h-40 sm:w-40 ${className ?? ''}`}
            >
                <Image
                    key={`${displaySrc}-${attempt}`}
                    src={displaySrc}
                    alt={alt}
                    width={144}
                    height={144}
                    sizes="(max-width: 640px) 112px, 144px"
                    className="h-28 w-28 rounded-full object-cover object-center sm:h-36 sm:w-36"
                    unoptimized={unoptimized}
                    loading="lazy"
                    onError={() => setAttempt((a) => Math.min(a + 1, candidates.length - 1))}
                    priority={false}
                />
            </div>
        )
    }

    return (
        <Image
            key={`${displaySrc}-${attempt}`}
            src={displaySrc}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 20vw"
            className={`absolute inset-0 z-0 h-full w-full object-cover object-top ${className ?? ''}`}
            unoptimized={unoptimized}
            onError={() => setAttempt((a) => Math.min(a + 1, candidates.length - 1))}
            priority={false}
        />
    )
}
