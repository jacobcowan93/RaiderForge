'use client'

import { useEffect, useState } from 'react'

import { ORDER_STATUS_CLASSES, ORDER_STATUS_LABELS, sectionHeading, TOAST_DURATION_MS } from '../_lib/marketplace-constants'
import type { OrderStatus } from '../_lib/marketplace-types'

export function RarityBadge({ rarity }: { rarity: string | null }) {
    if (!rarity) return null
    const r = rarity.toLowerCase()
    const cls =
        r === 'legendary'
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            : r === 'epic'
              ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
              : r === 'rare'
                ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                : r === 'uncommon'
                  ? 'border-rf-green/40 bg-rf-green/10 text-rf-green'
                  : 'border-white/15 bg-white/[0.05] text-rf-textSoft'
    return (
        <span className={`text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border font-bold ${cls}`}>
            {rarity}
        </span>
    )
}

export function TypeBadge({ type }: { type: string | null }) {
    if (!type) return null
    return (
        <span className="text-[8px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-rf-textSoft font-semibold">
            {type}
        </span>
    )
}

export function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase()
    const cls =
        s === 'active'
            ? 'bg-rf-green/12 text-rf-green border-rf-green/25'
            : s === 'sold'
              ? 'bg-rf-blue/10 text-rf-blue border-rf-blue/25'
              : s === 'cancelled'
                ? 'bg-white/[0.04] text-rf-textSoft border-white/10'
                : 'bg-rf-orange/10 text-rf-orange border-rf-orange/25'
    return (
        <span className={`text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border font-bold ${cls}`}>
            {status}
        </span>
    )
}

export function Spinner({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="animate-spin"
            aria-hidden
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

export function ErrorMsg({ msg }: { msg: string | null }) {
    if (!msg) return null
    return (
        <p className="text-xs text-rf-red/80 flex items-center gap-1.5">
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden className="shrink-0">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 5Zm0 6.5a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75Z" />
            </svg>
            {msg}
        </p>
    )
}

export function Divider({ label }: { label?: string }) {
    if (!label) return <hr className="border-white/[0.06] my-5" />
    return (
        <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-white/[0.06]" />
            <span className={sectionHeading}>{label}</span>
            <hr className="flex-1 border-white/[0.06]" />
        </div>
    )
}

export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, TOAST_DURATION_MS)
        return () => clearTimeout(t)
    }, [onDone])
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-rf-bgSoft border border-rf-green/35 shadow-xl shadow-black/40 text-sm text-rf-green font-medium pointer-events-none">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.25 4.72a.75.75 0 0 1 0 1.06l-3.5 3.5a.75.75 0 0 1-1.06 0l-1.5-1.5a.75.75 0 1 1 1.06-1.06l.97.97 2.97-2.97a.75.75 0 0 1 1.06 0Z" />
            </svg>
            {msg}
        </div>
    )
}

export function OrderStatusBadge({ status }: { status: string }) {
    const cls = ORDER_STATUS_CLASSES[status as OrderStatus] ?? 'bg-white/[0.04] text-rf-textSoft border-white/10'
    const label = ORDER_STATUS_LABELS[status as OrderStatus] ?? status.replace(/_/g, ' ')
    return (
        <span className={`text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border font-bold ${cls}`}>
            {label}
        </span>
    )
}

export function ItemIcon({ url, name, size = 48 }: { url: string | null; name: string; size?: number }) {
    const [err, setErr] = useState(false)
    if (!url || err) {
        return (
            <div
                style={{ width: size, height: size }}
                className="shrink-0 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-rf-textSoft/40"
            >
                <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                </svg>
            </div>
        )
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={url}
            alt={name}
            width={size}
            height={size}
            onError={() => setErr(true)}
            className="shrink-0 rounded-md object-contain bg-black/40"
            style={{ width: size, height: size }}
        />
    )
}
