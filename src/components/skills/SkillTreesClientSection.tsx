'use client'

import { Suspense, useState } from 'react'
import { PlannerSkeleton } from '@/components/ui/Skeleton'
import { SkillTreeErrorBoundary } from '@/components/skills/SkillTreeErrorBoundary'
import { SkillTreePlanner } from '@/components/skills/SkillTreePlanner'
import { SharedBuildsGallery, type SharedBuild } from '@/components/skills/SharedBuildsGallery'

export function SkillTreesClientSection() {
    const [newBuild, setNewBuild] = useState<SharedBuild | null>(null)

    return (
        <>
            {/* ── Community gallery ───────────────────────────── */}
            <SharedBuildsGallery newBuild={newBuild} />

            {/* ── Divider ─────────────────────────────────────── */}
            <div className="flex items-center gap-4 my-2">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-white/20 font-semibold shrink-0">
                    Your Build
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* ── Planner ─────────────────────────────────────── */}
            <SkillTreeErrorBoundary>
                <Suspense fallback={<PlannerSkeleton />}>
                    <SkillTreePlanner onBuildShared={setNewBuild} />
                </Suspense>
            </SkillTreeErrorBoundary>
        </>
    )
}
