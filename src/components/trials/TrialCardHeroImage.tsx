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
    /** `pill`: small 28×28 icon. `circle`: rectangular thumbnail. `shield`: circular art + white ring (in-game badge). `banner`: fill parent. */
    variant?: 'banner' | 'pill' | 'circle' | 'shield'
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
            <Image
                key={`${displaySrc}-${attempt}`}
                src={displaySrc}
                alt={alt}
                width={400}
                height={225}
                sizes="(max-width: 640px) 260px, 400px"
                className={`mb-4 h-44 w-full max-w-[260px] rounded-xl object-cover sm:h-52 ${className ?? ''}`}
                unoptimized={unoptimized}
                loading="lazy"
                onError={() => setAttempt((a) => Math.min(a + 1, candidates.length - 1))}
                priority={false}
            />
        )
    }

    if (variant === 'shield') {
        return (
            <div
                className={`relative mx-auto flex aspect-square h-[7.75rem] w-[7.75rem] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#cfc8bc] shadow-[0_4px_16px_rgba(0,0,0,0.28)] ring-[3px] ring-white sm:h-[9rem] sm:w-[9rem] ${className ?? ''}`}
            >
                <Image
                    key={`${displaySrc}-${attempt}`}
                    src={displaySrc}
                    alt={alt}
                    width={240}
                    height={240}
                    sizes="(max-width: 640px) 124px, 144px"
                    className="h-full w-full rounded-full object-contain object-center p-0.5"
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
