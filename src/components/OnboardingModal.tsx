'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'rf-onboarding-seen-v1'

type Feature = { icon: string; label: string; desc: string; href: string; color: string }

const FEATURES: Feature[] = [
    { icon: '📋', label: 'Blueprint Tracker',  desc: 'Track owned & missing',             href: '/blueprints',  color: 'border-yellow-500/20 hover:border-yellow-500/40' },
    { icon: '🌲', label: 'Skill Tree Planner', desc: 'Build & share your setup',          href: '/skill-trees', color: 'border-blue-500/20 hover:border-blue-500/40' },
    { icon: '🛒', label: 'Marketplace',        desc: 'Buy, sell, AI-optimize listings',   href: '/marketplace', color: 'border-orange-500/20 hover:border-orange-500/40' },
    { icon: '⚡', label: 'Loadout Builder',    desc: 'Plan your gear, saved in-browser',  href: '/loadouts',    color: 'border-orange-400/20 hover:border-orange-400/40' },
    { icon: '🎯', label: 'Weekly Trials',      desc: 'Rotations, tips & countdown',       href: '/trials',      color: 'border-red-500/20 hover:border-red-500/40' },
]

/** Returns all keyboard-focusable elements inside a container. */
function getFocusable(container: HTMLElement): HTMLElement[] {
    return Array.from(
        container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
    )
}

export function OnboardingModal() {
    const [open, setOpen] = useState(false)
    const [neverShow, setNeverShow] = useState(false)
    const panelRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const titleId = useId()

    /* Show once per browser — check after mount to avoid SSR hydration mismatch */
    useEffect(() => {
        try {
            if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
        } catch { /* localStorage unavailable */ }
    }, [])

    /* Focus the close button when modal opens */
    useEffect(() => {
        if (open) closeRef.current?.focus()
    }, [open])

    const dismiss = useCallback(() => {
        try {
            if (neverShow) localStorage.setItem(STORAGE_KEY, '1')
            else localStorage.setItem(STORAGE_KEY, '1') // always persist on any dismiss
        } catch { /* ignore */ }
        setOpen(false)
    }, [neverShow])

    /* Escape key */
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [open, dismiss])

    /* Focus trap — cycle through focusable elements with Tab / Shift+Tab */
    useEffect(() => {
        if (!open || !panelRef.current) return
        const panel = panelRef.current

        const trap = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return
            const focusable = getFocusable(panel)
            if (focusable.length === 0) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus() }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus() }
            }
        }

        panel.addEventListener('keydown', trap)
        return () => panel.removeEventListener('keydown', trap)
    }, [open])

    /* Prevent background scroll while open */
    useEffect(() => {
        if (!open) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [open])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={dismiss}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className="rf-modal-enter rf-corner-accent relative w-full max-w-[26rem] rounded-2xl border border-rf-border bg-rf-bgPanel shadow-2xl shadow-black/70 overflow-hidden"
            >
                {/* Top neon stripe */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-rf-cyan/60 to-transparent" aria-hidden="true" />

                <div className="p-6">
                    {/* Header */}
                    <div className="mb-5 flex items-start justify-between gap-4">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-rf-cyan/30 bg-rf-cyan/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rf-cyan">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-rf-cyan animate-pulse" aria-hidden="true" />
                                Welcome to RaiderForge
                            </div>
                            <h2 id={titleId} className="text-[1.3rem] font-black tracking-tight text-white leading-snug">
                                The ARC Raiders<br />Community Toolkit
                            </h2>
                            <p className="mt-1.5 text-[12px] text-rf-textSoft leading-snug">
                                Free, fan-made companion — not affiliated with Embark Studios.
                            </p>
                        </div>
                        <button
                            ref={closeRef}
                            type="button"
                            onClick={dismiss}
                            className="rf-focus-ring shrink-0 mt-0.5 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                            aria-label="Close welcome message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                            </svg>
                        </button>
                    </div>

                    {/* Feature grid */}
                    <nav aria-label="Available tools">
                        <ul className="mb-4 grid grid-cols-2 gap-2">
                            {FEATURES.map(({ icon, label, desc, href, color }) => (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        onClick={dismiss}
                                        className={`rf-focus-ring flex flex-col gap-1 rounded-xl border bg-white/[0.03] p-3 hover:bg-white/[0.07] transition-all ${color}`}
                                    >
                                        <span className="text-lg leading-none" aria-hidden="true">{icon}</span>
                                        <span className="text-[11px] font-semibold text-white leading-snug">{label}</span>
                                        <span className="text-[10px] text-rf-textSoft leading-snug">{desc}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Beta disclaimer */}
                    <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-950/40 px-3 py-2.5 text-[11px] text-amber-200/70 leading-relaxed">
                        <strong className="text-amber-300/90">Beta software.</strong>{' '}
                        Some tools are still in development. Data is community-sourced and may not reflect the latest game patch.
                    </div>

                    {/* Don't-show-again + CTA */}
                    <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                            <input
                                type="checkbox"
                                checked={neverShow}
                                onChange={e => setNeverShow(e.target.checked)}
                                className="rf-checkbox"
                                aria-label="Don't show this again"
                            />
                            <span className="text-[11px] text-rf-textSoft group-hover:text-rf-text transition-colors">
                                Don&apos;t show again
                            </span>
                        </label>

                        <button
                            type="button"
                            onClick={dismiss}
                            className="rf-focus-ring rounded-xl bg-rf-cyan px-5 py-2 text-[13px] font-bold text-black hover:bg-cyan-300 transition-colors shrink-0"
                        >
                            Explore →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
