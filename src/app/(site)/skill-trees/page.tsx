import type { Metadata } from 'next'
import Link from 'next/link'

import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { SharedBuildsGallery } from '@/components/skills/SharedBuildsGallery'
import { getSiteOrigin } from '@/lib/site/siteOrigin'

export const metadata: Metadata = {
    title: 'Skill Tree Planner — Build & Share ARC Raiders Builds',
    description:
        'Plan your ARC Raiders skill tree and allocate expedition points across Conditioning, Mobility, and Survival branches. Browse community builds, share your setup with a link, and find the meta.',
    keywords: ['ARC Raiders skill tree', 'skill planner', 'ARC Raiders build', 'expedition points', 'ARC Raiders skills'],
    alternates: { canonical: 'https://raiderforge.org/skill-trees' },
    openGraph: {
        title: 'ARC Raiders Skill Tree Planner | RaiderForge',
        description: 'Allocate expedition points, plan your ARC Raiders skill build, and browse community setups.',
        url: 'https://raiderforge.org/skill-trees',
        siteName: 'RaiderForge',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ARC Raiders Skill Tree Planner | RaiderForge',
        description: 'Plan your ARC Raiders skill build across Conditioning, Mobility, and Survival.',
    },
}

export default function SkillTreesPage() {
    return (
        <div className="py-14 px-6 max-w-7xl mx-auto">

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="mb-10 pl-1">
                <div className="border-l-2 border-rf-red pl-5" style={{ borderColor: 'rgba(255,64,64,0.70)', boxShadow: '-2px 0 12px -2px rgba(255,64,64,0.25)' }}>
                    <span className="text-xs uppercase tracking-widest font-bold rf-glow-red" style={{ color: '#ff4040' }}>
                        Character
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-white text-shadow-hero">
                            Community{' '}
                            <span className="text-rf-red" style={{ textShadow: '0 0 20px rgba(255,64,64,0.50)' }}>Skill Builds</span>
                        </h1>
                        <PageMaturityBadge level="beta" />
                    </div>
                    <p className="mt-2.5 text-sm max-w-2xl text-white/85 leading-relaxed">
                        Explore skill tree builds shared by the community. Browse{' '}
                        <span className="text-green-400 font-semibold">Conditioning</span>,{' '}
                        <span className="text-yellow-400 font-semibold">Mobility</span>, and{' '}
                        <span className="text-red-400 font-semibold">Survival</span>{' '}
                        builds — or create and share your own.
                    </p>

                    {/* ── Build Your Own CTA ─────────────────────────────────── */}
                    <div className="mt-5">
                        <Link
                            href="/skill-trees/builder?new=1"
                            className="rf-btn-primary inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold active:scale-[0.97]"
                        >
                            <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth={2.5}
                                 strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Build Your Own Skill Tree
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Community gallery ─────────────────────────────────────────── */}
            <SharedBuildsGallery newBuild={null} />

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
