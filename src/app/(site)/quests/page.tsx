import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getGameDataProvider } from '@/lib/game-data/provider'
import type { GameQuest } from '@/lib/game-data/types'
import { QuestsClientSection } from './_components/QuestsClientSection'
import { getSiteOrigin } from '@/lib/site/siteOrigin'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'

const origin    = getSiteOrigin()
const ogTitle   = 'Quests — ARC Raiders | RaiderForge'
const ogDesc    = 'Browse all 94 ARC Raiders quests. Filter by trader — Celeste, Apollo, Lance, Shani, Tian Wen — and find objectives, rewards, and quest chains.'
const ogImage   = '/images/header/ARC_Header.jpeg'

export const metadata: Metadata = {
    metadataBase: new URL(origin),
    title: ogTitle,
    description: ogDesc,
    alternates: { canonical: '/quests' },
    openGraph: {
        title: ogTitle, description: ogDesc,
        url: new URL('/quests', `${origin}/`).href,
        siteName: 'RaiderForge', type: 'website', locale: 'en_US',
        images: [{ url: ogImage, width: 1200, height: 630, alt: 'RaiderForge — ARC Raiders' }],
    },
    twitter: { card: 'summary_large_image', title: ogTitle, description: ogDesc, images: [ogImage] },
}

async function QuestsContent() {
    let quests: GameQuest[] = []
    try {
        quests = await getGameDataProvider().getQuests()
    } catch (e) {
        console.warn('[/quests] failed to fetch quests', e)
    }

    // Sort alphabetically by name
    quests.sort((a, b) => a.name.localeCompare(b.name))

    return <QuestsClientSection quests={quests} />
}

export default function QuestsPage() {
    return (
        <div className="py-14 px-6 max-w-7xl mx-auto">

            {/* ── Page header ───────────────────────────────────────────────── */}
            <div className="mb-10 pl-1">
                <div className="border-l-2 border-yellow-500 pl-5">
                    <span className="text-xs uppercase tracking-widest text-yellow-500 font-semibold drop-shadow-sm">
                        Progression
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Quests
                        </h1>
                        <PageMaturityBadge level="beta" />
                    </div>
                    <p className="mt-2 text-sm max-w-2xl text-white/75 leading-relaxed">
                        All 94 ARC Raiders quests from every trader — filter by NPC, search by name,
                        and follow the quest chain arrows to plan your progression path.
                    </p>
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────────────── */}
            <Suspense fallback={<QuestsSkeleton />}>
                <QuestsContent />
            </Suspense>

            <p className="mt-12 text-[11px] text-white/18 leading-relaxed">
                Quest data sourced from the{' '}
                <a
                    href="https://github.com/Mahcks/arcraiders-data-api"
                    target="_blank" rel="noopener noreferrer"
                    className="hover:text-white/40 transition-colors underline underline-offset-2"
                >
                    arcdata community API
                </a>{' '}
                (backed by{' '}
                <a
                    href="https://github.com/RaidTheory/arcraiders-data"
                    target="_blank" rel="noopener noreferrer"
                    className="hover:text-white/40 transition-colors underline underline-offset-2"
                >
                    RaidTheory
                </a>
                ). Not affiliated with Embark Studios. Data may lag game patches.
            </p>
        </div>
    )
}

function QuestsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Filter bar */}
            <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 rounded-lg bg-white/[0.05]" />
                ))}
            </div>
            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-48 rounded-2xl bg-white/[0.04]" />
                ))}
            </div>
        </div>
    )
}
