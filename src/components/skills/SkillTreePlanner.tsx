'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { SkillBranch } from '@/data/skillTree'
import { BRANCH_META, BRANCHES } from '@/data/skillTree'
import {
    type BuildAllocations,
    emptyBuild,
    decodeBuildFromUrl,
    sanitizeBuild,
    totalPoints,
} from '@/lib/skills/planner'
import { loadSkillTreeSave, saveSkillTreeSave } from '@/lib/skill-tree/skillTreeSaveStorage'
import { BranchTree } from './BranchTree'
import { BuildSidebar } from './BuildSidebar'

// ── Branch tab selector ───────────────────────────────────────────────────────

interface TabBarProps {
    active:   SkillBranch
    onChange: (b: SkillBranch) => void
}

function BranchTabBar({ active, onChange }: TabBarProps) {
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
                            color:      isActive ? meta.hex : 'rgba(255,255,255,0.35)',
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
}

// ── Main planner ──────────────────────────────────────────────────────────────

export function SkillTreePlanner() {
    const searchParams = useSearchParams()
    const initRef      = useRef(false)

    // Initialise from URL ?b= param, then fall back to localStorage
    const [allocs, setAllocs] = useState<BuildAllocations>(() => {
        const urlParam = typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('b')
            : null
        if (urlParam) {
            const decoded = decodeBuildFromUrl(urlParam)
            if (Object.keys(decoded).length > 0) return decoded
        }
        if (typeof window === 'undefined') return emptyBuild()
        const saved = loadSkillTreeSave()
        return sanitizeBuild(saved.allocations)
    })

    // Re-read URL param if searchParams changes (back/forward nav, external link)
    useEffect(() => {
        if (!initRef.current) {
            initRef.current = true
            return
        }
        const b = searchParams.get('b')
        if (b) {
            const decoded = decodeBuildFromUrl(b)
            if (Object.keys(decoded).length > 0) setAllocs(decoded)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    // Persist to localStorage on every change
    useEffect(() => {
        saveSkillTreeSave({ version: 1, allocations: allocs })
    }, [allocs])

    // Mobile: which branch tab is active
    const [activeBranch, setActiveBranch] = useState<SkillBranch>('Conditioning')

    const handleChange = useCallback((next: BuildAllocations) => {
        setAllocs(next)
    }, [])

    // Sidebar visibility state (mobile collapsible)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Live point total for the aria-live announcement
    const total = useMemo(() => totalPoints(allocs), [allocs])

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

            {/* ── aria-live: announces total points to screen readers ─────── */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {total} expedition point{total !== 1 ? 's' : ''} spent
            </div>

            {/* ── Mobile branch tabs + sidebar toggle ─────────────────────── */}
            <div className="flex items-center gap-3 lg:hidden">
                <div className="flex-1">
                    <BranchTabBar active={activeBranch} onChange={setActiveBranch} />
                </div>
                <button
                    type="button"
                    onClick={() => setSidebarOpen((v) => !v)}
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
                    <BuildSidebar allocs={allocs} onChange={handleChange} />
                </div>
            )}

            {/* ── Main layout ─────────────────────────────────────────────── */}
            <div className="flex gap-6 items-start">

                {/* Branch trees */}
                <div className="flex-1 min-w-0">

                    {/* Desktop: all 3 branches side by side */}
                    <div className="hidden lg:grid lg:grid-cols-3 gap-4">
                        {BRANCHES.map((b) => (
                            <div
                                key={b}
                                className="rounded-2xl border border-white/[0.06] p-4 transition-colors"
                                style={{
                                    background:  'rgba(15,20,27,0.55)',
                                    borderColor: 'rgba(255,255,255,0.06)',
                                }}
                            >
                                <BranchTree branch={b} allocs={allocs} onChange={handleChange} />
                            </div>
                        ))}
                    </div>

                    {/* Mobile: single active branch */}
                    <div className="lg:hidden">
                        <div
                            className="rounded-2xl border border-white/[0.06] p-4"
                            style={{ background: 'rgba(15,20,27,0.55)' }}
                        >
                            <BranchTree branch={activeBranch} allocs={allocs} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Desktop sidebar */}
                <div id="build-summary" className="hidden lg:block w-72 shrink-0 sticky top-24">
                    <BuildSidebar allocs={allocs} onChange={handleChange} />
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
                <span className="text-white/18">Right-click or − key to remove one rank</span>
            </div>
        </div>
    )
}
