import { Suspense } from 'react'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { SkillTreePlanner } from '@/components/skills/SkillTreePlanner'

export const metadata = {
    title: 'Skill Tree Planner — ARC Raiders | RaiderForge',
    description:
        'Plan your ARC Raiders skill build across Conditioning, Mobility, and Survival. ' +
        'Track points spent, check prerequisites, and share your build with a single link.',
}

function PlannerSkeleton() {
    return (
        <div className="grid lg:grid-cols-3 gap-4 animate-pulse">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-white/[0.05] p-4"
                    style={{ background: 'rgba(15,20,27,0.55)', aspectRatio: '3/4.5' }}
                >
                    <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
                    <div className="h-2 bg-white/[0.05] rounded w-2/3 mb-4" />
                    <div className="h-full bg-white/[0.03] rounded-xl" />
                </div>
            ))}
        </div>
    )
}

export default function SkillTreesPage() {
    return (
        <div className="py-14 px-6 max-w-7xl mx-auto">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="mb-10 pl-1">
                <div className="border-l-2 border-rf-red pl-5">
                    <span className="text-xs uppercase tracking-widest text-rf-red font-semibold drop-shadow-sm">
                        Character
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-white text-shadow-hero">
                            Skill Tree{' '}
                            <span className="text-rf-red">Planner</span>
                        </h1>
                        <PageMaturityBadge level="beta" />
                    </div>
                    <p className="mt-2.5 text-sm max-w-2xl text-white/70 leading-relaxed">
                        Allocate expedition points across three branches —{' '}
                        <span className="text-amber-400/80 font-medium">Conditioning</span>,{' '}
                        <span className="text-sky-400/80 font-medium">Mobility</span>, and{' '}
                        <span className="text-emerald-400/80 font-medium">Survival</span>.
                        Click a node to unlock it; right-click to remove a rank.
                        Share your build with the copy-link button.
                    </p>

                    {/* How-to hint bar */}
                    <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-white/38">
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/12 inline-flex items-center justify-center text-[9px] text-white/30">1</span>
                            Multi-rank skills require up to 5 clicks
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/12 inline-flex items-center justify-center text-[9px] text-white/30">2</span>
                            Keystones unlock at 15 branch points
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/12 inline-flex items-center justify-center text-[9px] text-white/30">3</span>
                            Capstones unlock at 36 branch points
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Planner (client, Suspense required for useSearchParams) ─── */}
            <Suspense fallback={<PlannerSkeleton />}>
                <SkillTreePlanner />
            </Suspense>

            {/* ── Footer attribution ───────────────────────────────────────── */}
            <p className="mt-12 text-[11px] text-white/18 leading-relaxed">
                Skill data sourced from{' '}
                <a
                    href="https://metaforge.app/arc-raiders/skill-builder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/40 transition-colors underline underline-offset-2"
                >
                    MetaForge — ARC Raiders Skill Builder
                </a>
                . RaiderForge is not affiliated with MetaForge or Embark Studios.
                Skill values may change with game patches.
            </p>
        </div>
    )
}
