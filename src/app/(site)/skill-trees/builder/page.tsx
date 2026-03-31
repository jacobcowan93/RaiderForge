import type { Metadata } from 'next'
import Link from 'next/link'

import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { SyncStatusBadge } from '@/components/SyncStatusBadge'
import { SkillTreesClientSection } from '@/components/skills/SkillTreesClientSection'
import { getSiteOrigin } from '@/lib/site/siteOrigin'

const origin = getSiteOrigin()
const ogTitle = 'Skill Tree Builder — ARC Raiders | RaiderForge'
const ogDescription = (
    'Plan your ARC Raiders skill build across Conditioning, Mobility, and Survival. ' +
    'Allocate expedition points, respect prerequisites, and share your build with one link.'
)

const ogImage = '/images/header/ARC_Header.jpeg'

export const metadata: Metadata = {
    metadataBase: new URL(origin),
    title: ogTitle,
    description: ogDescription,
    alternates: {
        canonical: '/skill-trees/builder',
    },
    openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: new URL('/skill-trees/builder', `${origin}/`).href,
        siteName: 'RaiderForge',
        type: 'website',
        locale: 'en_US',
        images: [{ url: ogImage, width: 1200, height: 630, alt: 'RaiderForge — ARC Raiders tactical hub' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [ogImage],
    },
}

export default function SkillTreeBuilderPage() {
    return (
        <div className="py-14 px-6 max-w-7xl mx-auto">

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="mb-10 pl-1">
                <div className="border-l-2 border-green-600 pl-5">
                    {/* Back to gallery */}
                    <Link
                        href="/skill-trees"
                        className="inline-flex items-center gap-1.5 text-[11px] text-white/40
                                   hover:text-white/65 transition-colors mb-2"
                    >
                        <svg width={11} height={11} viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth={2.5}
                             strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Community builds
                    </Link>

                    <span className="text-xs uppercase tracking-widest text-green-600 font-semibold drop-shadow-sm">
                        Character
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-shadow-hero">
                            Skill Tree{' '}
                            <span className="text-green-500">Builder</span>
                        </h1>
                        <PageMaturityBadge level="beta" />
                        <SyncStatusBadge />
                    </div>
                    <p className="mt-2.5 text-sm max-w-2xl text-white/85 leading-relaxed">
                        Allocate expedition points across three branches —{' '}
                        <span className="text-green-400 font-semibold">Conditioning</span>,{' '}
                        <span className="text-yellow-400 font-semibold">Mobility</span>, and{' '}
                        <span className="text-red-400 font-semibold">Survival</span>.
                        Click nodes to allocate points, then share your build.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-white/60">
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/25 inline-flex items-center justify-center text-[9px] text-white/55">
                                1
                            </span>
                            Multi-rank skills: Arrow keys or click to add/remove ranks
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/25 inline-flex items-center justify-center text-[9px] text-white/55">
                                2
                            </span>
                            Keystones unlock at 15 branch points
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/25 inline-flex items-center justify-center text-[9px] text-white/55">
                                3
                            </span>
                            Capstones unlock at 36 branch points
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Planner (share row + tree + sidebar) ──────────────────────── */}
            <SkillTreesClientSection />

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
