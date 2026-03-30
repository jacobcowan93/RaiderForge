'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { SkillBranch } from '@/data/skillTree'
import { BRANCH_META, BRANCHES } from '@/data/skillTree'
import {
    type BuildAllocations,
    emptyBuild,
    decodeBuildFromUrlParam,
    encodeBuildToUrl,
    sanitizeBuild,
    normalizeBuild,
    totalPoints,
} from '@/lib/skills/planner'
import { EXPEDITION_CAPS, type ExpeditionLevel } from '@/lib/skills/caps'
import { loadSkillTreeSave, saveSkillTreeSave } from '@/lib/skill-tree/skillTreeSaveStorage'
import { BranchTree } from './BranchTree'
import { BuildSidebar } from './BuildSidebar'
import { UnifiedSkillTreeCanvas } from './UnifiedSkillTreeCanvas'

const EXPEDITION_LEVEL_KEY = 'raiderforge.expedition-level.v1'

/** Default 2 = both expeditions (86 pts). Base / Exp 1 stored as 0 / 1. */
function loadExpeditionLevel(): ExpeditionLevel {
    if (typeof window === 'undefined') return 2
    const raw = localStorage.getItem(EXPEDITION_LEVEL_KEY)
    if (raw === null || raw === '') return 2
    const n = Number(raw)
    if (n === 0 || n === 1 || n === 2) return n
    return 2
}

// ── Branch tab selector ───────────────────────────────────────────────────────

interface TabBarProps {
    active:   SkillBranch
    onChange: (b: SkillBranch) => void
}

const BranchTabBar = memo(function BranchTabBar({ active, onChange }: TabBarProps) {
    return (
        <div
            role="tablist"
            aria-label="Skill branches"
            className="flex gap-1 rounded-xl p-1 border border-white/[0.06]"
            style={{ background: 'rgba(7,9,13,0.7)' }}
        >
            {BRANCHES.map((b) => {
                const meta     = BRANCH_META[b]
                const isActive = b === active
                return (
                    <button
                        key={b}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(b)}
                        className="flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150"
                        style={{
                            color:      isActive ? meta.hex : 'rgba(255,255,255,0.72)',
                            background: isActive ? `${meta.hex}15` : 'transparent',
                            border:     isActive ? `1px solid ${meta.hex}40` : '1px solid transparent',
                        }}
                    >
                        {meta.label}
                    </button>
                )
            })}
        </div>
    )
})

BranchTabBar.displayName = 'BranchTabBar'

// ── Main planner ──────────────────────────────────────────────────────────────

/**
 * Skill tree planner — single source of truth for `allocs` in React state.
 *
 * **URL sync (no replace loop):** The effect that calls `router.replace` only runs when
 * `pathname + search` would differ from the URL implied by `encodeBuildToUrl(allocs)`. After
 * `replace`, the URL matches state, so the condition stays false until `allocs` changes again.
 *
 * **searchParams effect:** Handles back/forward and pasted links; skips the first run so we
 * do not clobber hydration. When `?b` updates, we decode into state.
 */

export function SkillTreePlanner({
    onAllocsChange,
    resetKey = 0,
}: {
    onAllocsChange?: (allocs: BuildAllocations, spentTotal: number) => void
    resetKey?: number
}) {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const initRef      = useRef(false)

    // Expedition level — determines how many total points are available
    const [expeditionLevel, setExpeditionLevel] = useState<ExpeditionLevel>(loadExpeditionLevel)

    const maxPts = EXPEDITION_CAPS[expeditionLevel]

    // Initialise from URL ?b= param, then fall back to localStorage
    const [allocs, setAllocs] = useState<BuildAllocations>(() => {
        const urlParam = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('b')
            : null
        if (urlParam) {
            const decoded = decodeBuildFromUrlParam(urlParam)
            if (Object.keys(decoded).length > 0) return decoded
        }
        if (typeof window === 'undefined') return emptyBuild()
        const saved = loadSkillTreeSave()
        return sanitizeBuild(saved.allocations, EXPEDITION_CAPS[loadExpeditionLevel()])
    })

    useEffect(() => {
        if (!initRef.current) {
            initRef.current = true
            return
        }
        const b = searchParams.get('b')
        if (b) {
            const decoded = decodeBuildFromUrlParam(b)
            if (Object.keys(decoded).length > 0) setAllocs(decoded)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    // External reset trigger — when resetKey increments, wipe all allocs
    useEffect(() => {
        if (!resetKey) return
        setAllocs(emptyBuild())
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey])

    // Notify parent of alloc changes (for the top-level share button)
    useEffect(() => {
        onAllocsChange?.(allocs, totalPoints(allocs))
    }, [allocs, onAllocsChange])

    // Persist allocations to localStorage on every change
    useEffect(() => {
        saveSkillTreeSave({ version: 1, allocations: allocs })
    }, [allocs])

    /**
     * Sync `?b=` with live allocations (relative URL). Uses the same encoding as
     * `buildSkillTreeShareUrl` in planner.ts — copy/share uses `getSiteOrigin()` + that helper
     * for absolute URLs on the clipboard.
     */
    useEffect(() => {
        const code = encodeBuildToUrl(allocs)
        const search = code ? `?b=${encodeURIComponent(code)}` : ''
        const next = `${pathname}${search}`
        if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== next) {
            router.replace(next, { scroll: false })
        }
    }, [allocs, pathname, router])

    // Persist expedition level + re-clamp build when level decreases
    const handleExpeditionChange = useCallback((level: ExpeditionLevel) => {
        setExpeditionLevel(level)
        localStorage.setItem(EXPEDITION_LEVEL_KEY, String(level))
        const newMax = EXPEDITION_CAPS[level]
        setAllocs((prev) => {
            const { allocs: clamped } = normalizeBuild(prev, newMax)
            return clamped
        })
    }, [])

    // Mobile: which branch tab is active
    const [activeBranch, setActiveBranch] = useState<SkillBranch>('Conditioning')

    const handleChange = useCallback((next: BuildAllocations) => {
        setAllocs(next)
    }, [])

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const toggleMobileBuildSidebar = useCallback(() => {
        setSidebarOpen((v) => !v)
    }, [])

    const spentTotal = useMemo(() => totalPoints(allocs), [allocs])

    return (
        <div className="flex flex-col gap-6 overflow-x-hidden">

            {/* ── Skip navigation — visible on keyboard focus only ─────────── */}
            <a
                href="#build-summary"
                className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-0 focus:left-0
                           focus:px-4 focus:py-2 focus:rounded-lg focus:text-xs focus:font-semibold
                           focus:text-white focus:bg-gray-900/95 focus:border focus:border-white/20
                           focus:shadow-lg"
            >
                Skip to build summary
            </a>

            {/* ── aria-live: announces total points (+ cap) to screen readers  */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {spentTotal} of {maxPts} expedition point{spentTotal !== 1 ? 's' : ''} spent
                {spentTotal >= maxPts ? ' — point cap reached' : ''}
            </div>

            {/* ── Mobile branch tabs + sidebar toggle ─────────────────────── */}
            <div className="flex items-center gap-3 lg:hidden">
                <div className="flex-1">
                    <BranchTabBar active={activeBranch} onChange={setActiveBranch} />
                </div>
                <button
                    type="button"
                    onClick={toggleMobileBuildSidebar}
                    aria-expanded={sidebarOpen}
                    aria-controls="mobile-build-summary"
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/50 hover:text-white/70 transition-colors shrink-0"
                    style={{ background: 'rgba(15,20,27,0.7)' }}
                >
                    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    Build
                </button>
            </div>

            {/* ── Mobile sidebar (collapsible) ─────────────────────────────── */}
            {sidebarOpen && (
                <div id="mobile-build-summary" className="lg:hidden">
                    <BuildSidebar
                        spentTotal={spentTotal}
                        maxPts={maxPts}
                        expeditionLevel={expeditionLevel}
                        onExpeditionChange={handleExpeditionChange}
                    />
                </div>
            )}

            {/* ── Main layout ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6">

                {/* Mobile: single active branch */}
                <div className="lg:hidden">
                    <div
                        className="rounded-2xl border border-white/[0.06] p-4"
                        style={{ background: 'rgba(15,20,27,0.55)' }}
                    >
                        <BranchTree branch={activeBranch} allocs={allocs} onChange={handleChange} maxPts={maxPts} />
                    </div>
                </div>

                {/* Desktop: unified fan-layout canvas — full width */}
                <div className="hidden lg:block">
                    <UnifiedSkillTreeCanvas allocs={allocs} onChange={handleChange} maxPts={maxPts} />
                </div>

                {/* Desktop sidebar — full width, below the canvas */}
                <div id="build-summary" className="hidden lg:block">
                    <BuildSidebar
                        spentTotal={spentTotal}
                        maxPts={maxPts}
                        expeditionLevel={expeditionLevel}
                        onExpeditionChange={handleExpeditionChange}
                    />
                </div>
            </div>

            {/* ── Legend ──────────────────────────────────────────────────── */}
            <div
                aria-label="Node state legend"
                className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-white/30"
            >
                <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded border border-white/08 inline-flex items-center justify-center" aria-hidden="true">
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2}>
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </span>
                    Locked — missing prereq or point gate
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded border border-white/15 inline-block" aria-hidden="true"/>
                    Available — click to allocate
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded inline-block" aria-hidden="true"
                          style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.5)' }}/>
                    Selected / partial ranks
                </span>
                <span className="text-white/18">Keyboard: ArrowUp/Right/+ add rank · ArrowDown/Left/−/Backspace remove · Right-click −1</span>
            </div>
        </div>
    )
}
