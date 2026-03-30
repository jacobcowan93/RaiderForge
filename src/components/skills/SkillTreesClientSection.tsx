'use client'

import { Suspense, useCallback, useState } from 'react'
import { PlannerSkeleton } from '@/components/ui/Skeleton'
import { SkillTreeErrorBoundary } from '@/components/skills/SkillTreeErrorBoundary'
import { SkillTreePlanner } from '@/components/skills/SkillTreePlanner'
import { SharedBuildsGallery, type SharedBuild } from '@/components/skills/SharedBuildsGallery'
import { type BuildAllocations, buildSkillTreeShareUrl } from '@/lib/skills/planner'
import { getSiteOrigin } from '@/lib/site/siteOrigin'

function ShareButton({ allocs, spentTotal }: { allocs: BuildAllocations; spentTotal: number }) {
    const [copied, setCopied] = useState(false)

    async function handleShare() {
        const url = buildSkillTreeShareUrl(allocs, getSiteOrigin())
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch { /* ignore */ }
    }

    const empty = spentTotal === 0

    return (
        <button
            type="button"
            onClick={handleShare}
            disabled={empty}
            title={empty ? 'Allocate some points first' : 'Copy shareable link'}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold
                       border transition-all duration-150 active:scale-[0.97]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       bg-white/10 border-white/25 text-white hover:bg-white/20 hover:border-white/40"
        >
            {copied ? (
                <>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="text-green-400">Link copied!</span>
                </>
            ) : (
                <>
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Copy share link
                </>
            )}
        </button>
    )
}

export function SkillTreesClientSection() {
    const [newBuild, setNewBuild] = useState<SharedBuild | null>(null)
    const [allocs, setAllocs] = useState<BuildAllocations>({})
    const [spentTotal, setSpentTotal] = useState(0)

    const handleAllocsChange = useCallback((a: BuildAllocations, pts: number) => {
        setAllocs(a)
        setSpentTotal(pts)
    }, [])

    return (
        <>
            {/* ── Community gallery ───────────────────────────── */}
            <SharedBuildsGallery newBuild={newBuild} />

            {/* ── Divider + share button row ───────────────────── */}
            <div className="flex items-center justify-between gap-4 mt-6 mb-2">
                <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-white/[0.12]" />
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/50 font-semibold shrink-0">
                        Your Build
                    </span>
                </div>
                <ShareButton allocs={allocs} spentTotal={spentTotal} />
            </div>

            {/* ── Planner ─────────────────────────────────────── */}
            <SkillTreeErrorBoundary>
                <Suspense fallback={<PlannerSkeleton />}>
                    <SkillTreePlanner
                        onBuildShared={setNewBuild}
                        onAllocsChange={handleAllocsChange}
                    />
                </Suspense>
            </SkillTreeErrorBoundary>
        </>
    )
}
