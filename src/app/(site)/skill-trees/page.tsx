import type { Metadata } from 'next'

import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { SkillTreesClientSection } from '@/components/skills/SkillTreesClientSection'
import { getSiteOrigin } from '@/lib/site/siteOrigin'

const origin = getSiteOrigin()
const ogTitle = 'Skill Tree Planner — ARC Raiders | RaiderForge'
const ogDescription = (
    'Plan your ARC Raiders skill build across Conditioning, Mobility, and Survival. ' +
    'Allocate expedition points, respect prerequisites, and share your build with one link.'
)

const ogImage = '/images/header/ARC_Header.jpeg'

/** Absolute canonical URL for Discord/Twitter crawlers (requires metadataBase). */
const skillTreesCanonical = new URL('/skill-trees', `${origin}/`).href

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
        url: skillTreesCanonical,
        siteName: 'RaiderForge',
        type: 'website',
        locale: 'en_US',
        images: [
            {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: 'RaiderForge — ARC Raiders tactical hub',
            },
        ],
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
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/45 leading-relaxed max-w-2xl">
                        <PageMaturityBadge level="beta" className="!text-[9px] !px-1.5 !py-0 shrink-0" />
                        <span>Beta – Builds saved via URL for now. Share links work instantly.</span>
                    </p>
                    <p className="mt-2.5 text-sm max-w-2xl text-white/70 leading-relaxed">
                        Allocate expedition points across three branches —{' '}
                        <span className="text-green-400/80 font-medium">Conditioning</span>,{' '}
                        <span className="text-yellow-400/80 font-medium">Mobility</span>, and{' '}
                        <span className="text-red-400/80 font-medium">Survival</span>.
                        Use keyboard or pointer on nodes; copy a share link when you are happy with the build.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-white/38">
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/12 inline-flex items-center justify-center text-[9px] text-white/30">
                                1
                            </span>
                            Multi-rank skills: Arrow keys or click to add/remove ranks
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/12 inline-flex items-center justify-center text-[9px] text-white/30">
                                2
                            </span>
                            Keystones unlock at 15 branch points
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded border border-white/12 inline-flex items-center justify-center text-[9px] text-white/30">
                                3
                            </span>
                            Capstones unlock at 36 branch points
                        </span>
                    </div>
                </div>
            </div>

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
