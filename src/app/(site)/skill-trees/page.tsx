import type { Metadata } from 'next'
import Link from 'next/link'

import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { SharedBuildsGallery } from '@/components/skills/SharedBuildsGallery'
import { getSiteOrigin } from '@/lib/site/siteOrigin'

const origin = getSiteOrigin()
const ogTitle = 'Community Skill Builds — ARC Raiders | RaiderForge'
const ogDescription = (
    'Browse ARC Raiders skill tree builds shared by the community. ' +
    'Find powerful builds across Conditioning, Mobility, and Survival, or share your own.'
)

const ogImage = '/images/header/ARC_Header.jpeg'

export const metadata: Metadata = {
    metadataBase: new URL(origin),
    title: ogTitle,
    description: ogDescription,
    alternates: {
        canonical: '/skill-trees',
    },
    openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: new URL('/skill-trees', `${origin}/`).href,
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

export default function SkillTreesPage() {
    return (
        <div className="py-14 px-6 max-w-7xl mx-auto">

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="mb-10 pl-1">
                <div className="border-l-2 border-green-600 pl-5">
                    <span className="text-xs uppercase tracking-widest text-green-600 font-semibold drop-shadow-sm">
                        Character
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-white text-shadow-hero">
                            Community{' '}
                            <span className="text-green-500">Skill Builds</span>
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
                            className="inline-flex items-center gap-2.5 rounded-xl px-5 py-2.5
                                       text-sm font-semibold border transition-all duration-150
                                       active:scale-[0.97] bg-green-700 text-white border-green-600/80
                                       hover:bg-green-600 hover:border-green-500 shadow-lg shadow-green-900/40"
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
