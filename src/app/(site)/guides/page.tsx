import Link from 'next/link'
import { GuidesHubClient } from '@/components/learning/GuidesHubClient'
import { ProgressThisWeekSummary } from '@/components/learning/ProgressThisWeekSummary'
import { RecommendedTracksSection } from '@/components/learning/RecommendedTracksSection'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { GuideArticleCard } from '@/components/learning/GuideArticleCard'
import { getFeaturedTrialWeek } from '@/data/trials'
import { GUIDE_ARTICLES, GUIDE_HUB_SHORTCUTS } from '@/data/guides'
import { DIFFICULTY_LABEL, LEARNING_TAG_LABEL, formatEstimatedTime } from '@/data/learningShared'
import { fetchMetaforgeGuidesSnapshot } from '@/lib/data/metaforge-guides'
import { METAFORGE_GUIDES_ATTRIBUTION } from '@/lib/live-data/attribution'

// ── Community-curated external guides ────────────────────────────────────────

const COMMUNITY_GUIDES = [
    {
        id: 1,
        title: "The Ultimate Beginner's Guide to ARC Raiders",
        type:  'video' as const,
        source: 'YouTube',
        author: 'Fallout Plays',
        url:   'https://www.youtube.com/watch?v=yoGtsBfe2Gk',
        thumbnail: 'https://i.ytimg.com/vi/yoGtsBfe2Gk/maxresdefault.jpg',
        description: '400+ hours of experience packed into one complete new-player guide.',
    },
    {
        id: 2,
        title: '10 Tips You NEED To Know As A Beginner',
        type:  'video' as const,
        source: 'YouTube',
        author: 'Community',
        url:   'https://www.youtube.com/watch?v=9k8Lu6a8w30',
        thumbnail: 'https://i.ytimg.com/vi/9k8Lu6a8w30/maxresdefault.jpg',
        description: 'Essential beginner mechanics and survival tips every new raider should know.',
    },
    {
        id: 3,
        title: 'Tips and Tricks Guide for Beginners 2026',
        type:  'article' as const,
        source: 'Stitch and Snare',
        author: 'Steve Sparacino',
        url:   'https://stitchandsnare.com/blog/arc-raiders-tips-and-tricks-guide-for-beginners-2026/',
        thumbnail: '',
        description: 'Budget loadouts, PvP rules of thumb, and what not to do as a new raider.',
    },
    {
        id: 4,
        title: 'Progression Guide – Fastest Ways to Gear Up',
        type:  'article' as const,
        source: 'The GATE',
        author: 'The GATE',
        url:   'https://www.thegate.ca/tech-gadgets/072329/arc-raiders-progression-guide-fastest-ways-to-gear-up/',
        thumbnail: '',
        description: 'Workshop priority order and early-game power spikes to accelerate your gear curve.',
    },
    {
        id: 5,
        title: 'Ultimate Beginner\'s Guide – Top Tips & Tricks',
        type:  'video' as const,
        source: 'YouTube',
        author: 'Community',
        url:   'https://www.youtube.com/watch?v=tQIzJEB3e2g',
        thumbnail: 'https://i.ytimg.com/vi/tQIzJEB3e2g/maxresdefault.jpg',
        description: 'Resource tracking, in-raid crafting, and advanced tricks for experienced raiders.',
    },
    {
        id: 6,
        title: '68 Useful Tips & Tricks — Beginner & Advanced Mega List',
        type:  'article' as const,
        source: 'Reddit',
        author: 'r/ArcRaiders',
        url:   'https://www.reddit.com/r/ArcRaiders/comments/1olvjsg/a_bunch_of_useful_arc_raider_guides_for_new/',
        thumbnail: '',
        description: 'Community-compiled mega list covering mechanics, loot routes, and survival habits.',
    },
]

export const metadata = {
    title: 'Guides — ARC Raiders | Raider Forge',
    description:
        'RaiderForge guides: scannable briefings for maps, weekly Trials prep, live conditions, and squad roles — plus MetaForge reference snapshots.',
}

const FEATURED_GUIDE_SLUGS = ['weekly-trials-prep', 'maps-command-center', 'roles-at-a-glance'] as const

const FLOW_STEPS = [
    {
        id: 'pick',
        label: 'Pick your objective',
        detail: 'Start with Trials, maps, loot habits, or role planning instead of scanning the whole library.',
    },
    {
        id: 'skim',
        label: 'Skim one briefing',
        detail: 'Each guide is short on purpose, with clear sections you can read before queueing.',
    },
    {
        id: 'branch',
        label: 'Open the right tool',
        detail: 'Jump out to Maps, Trials, or MetaForge only when you need deeper reference data.',
    },
]

export default async function GuidesPage() {
    const snapshot = await fetchMetaforgeGuidesSnapshot()
    const featuredTrialsWeek = getFeaturedTrialWeek()
    const featuredGuides = FEATURED_GUIDE_SLUGS.map((slug) => GUIDE_ARTICLES.find((guide) => guide.slug === slug)).filter(Boolean)
    const totalMinutes = GUIDE_ARTICLES.reduce((sum, guide) => sum + guide.estimatedMinutes, 0)
    const topicLabels = Array.from(new Set(GUIDE_ARTICLES.flatMap((guide) => guide.tags.map((tag) => LEARNING_TAG_LABEL[tag]))))

    return (
        <div className="max-w-6xl mx-auto px-4 py-10 sm:px-6">
            <header className="mb-12 rounded-3xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(120,22,22,0.18),rgba(4,7,12,0.82))] p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
                    <div>
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rf-red">Briefings</p>
                            <PageMaturityBadge level="beta" />
                        </div>
                        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                            Guides that help you decide what to do next, fast.
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/68 sm:text-[15px]">
                            RaiderForge guides should feel like pre-raid briefings, not a wiki maze. Start with a practical
                            question, read one short page, then jump straight into the map, trial list, or build tool that matches
                            your next run.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="#guide-library"
                                className="inline-flex items-center rounded-xl border border-rf-red/40 bg-rf-red/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rf-red/16"
                            >
                                Browse guide library
                            </Link>
                            <Link
                                href="/trials"
                                className="inline-flex items-center rounded-xl border border-white/10 bg-black/25 px-4 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:border-white/20 hover:text-white"
                            >
                                Open this week&apos;s Trials
                            </Link>
                        </div>
                    </div>

                    <aside className="rounded-2xl border border-white/10 bg-black/30 p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">At a glance</p>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Guides</p>
                                <p className="mt-1 text-2xl font-black text-white">{GUIDE_ARTICLES.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Topics</p>
                                <p className="mt-1 text-2xl font-black text-white/88">{topicLabels.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Read time</p>
                                <p className="mt-1 text-xl font-black text-white/88">{formatEstimatedTime(totalMinutes)}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {topicLabels.slice(0, 5).map((label) => (
                                <span
                                    key={label}
                                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-medium text-white/58"
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                        <p className="mt-4 text-xs leading-relaxed text-white/46">
                            Need raw quest, trader, or arc reference after the briefing? RaiderForge surfaces a live{' '}
                            <a
                                href={METAFORGE_GUIDES_ATTRIBUTION.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rf-red/85 underline underline-offset-2 hover:text-rf-red"
                            >
                                MetaForge
                            </a>{' '}
                            snapshot lower on this page.
                        </p>
                    </aside>
                </div>

                <div className="mt-8 grid gap-3 md:grid-cols-3">
                    {FLOW_STEPS.map((step, index) => (
                        <div key={step.id} className="rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rf-red/82">
                                0{index + 1}
                            </p>
                            <h2 className="mt-2 text-sm font-bold text-white">{step.label}</h2>
                            <p className="mt-1 text-sm leading-relaxed text-white/52">{step.detail}</p>
                        </div>
                    ))}
                </div>
            </header>

            <section aria-labelledby="start-here-heading" className="mb-12">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 id="start-here-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                            Start Here
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/52">
                            Three fast-entry briefings for the most common launch-week questions.
                        </p>
                    </div>
                </div>
                <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3 list-none p-0 m-0">
                    {featuredGuides.map((guide) => (
                        <li key={guide.slug}>
                            <GuideArticleCard article={guide} />
                        </li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="operational-paths-heading" className="mb-12">
                <div className="mb-5">
                    <h2 id="operational-paths-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                        Operational Paths
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/52">
                        Use the weekly track if you&apos;re playing right now. Use the playlists when you want a cleaner learning sequence.
                    </p>
                </div>
                <ProgressThisWeekSummary
                    weekLabel={featuredTrialsWeek.label}
                    featuredTrialIds={featuredTrialsWeek.trials.map((t) => t.id)}
                />
                <RecommendedTracksSection heading="Starter playlists" />
            </section>

            <section aria-labelledby="shortcuts-heading" className="mb-14">
                <div className="mb-5">
                    <h2 id="shortcuts-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                        Open The Right Surface
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/52">
                        When a guide answers the “why,” these shortcuts take you to the tool that handles the “now what.”
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {GUIDE_HUB_SHORTCUTS.map((tile) => {
                        const CardInner = (
                            <>
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                                        {tile.variant === 'metaforge' ? 'Reference' : 'Tool'}
                                    </span>
                                    <span className="text-xs font-semibold text-rf-red/90">{tile.cta} →</span>
                                </div>
                                <h3 className="text-lg font-bold text-white">{tile.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/55">{tile.summary}</p>
                            </>
                        )
                        const cardClass =
                            'block h-full rounded-2xl border border-white/[0.08] bg-black/35 p-5 text-left transition-colors hover:border-red-500/35 hover:bg-black/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50'

                        if (tile.variant === 'metaforge') {
                            return (
                                <a key={tile.id} href={tile.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
                                    {CardInner}
                                </a>
                            )
                        }
                        return (
                            <Link key={tile.id} href={tile.href} className={cardClass}>
                                {CardInner}
                            </Link>
                        )
                    })}
                </div>
            </section>

            <section id="guide-library" aria-labelledby="catalog-heading" className="mb-14 scroll-mt-24">
                <div className="mb-5">
                    <h2 id="catalog-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                        Guide Library
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/52">
                        This is the core RaiderForge reading surface. Search by question, filter by pace or topic, and open the
                        shortest useful briefing instead of digging through everything manually.
                    </p>
                </div>
                <GuidesHubClient articles={GUIDE_ARTICLES} />
            </section>

            <section aria-labelledby="supporting-reference-heading" className="mb-10">
                <div className="mb-5">
                    <h2 id="supporting-reference-heading" className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                        Supporting Reference
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/52">
                        These aren&apos;t the main flow. They&apos;re here when you want live external data or deeper community takes after the RaiderForge briefing.
                    </p>
                </div>
            </section>

            <section aria-labelledby="metaforge-data-heading" className="mb-12">
                <h2 id="metaforge-data-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-2">
                    From MetaForge (live snapshot)
                </h2>
                <p className="text-xs text-white/35 mb-6 max-w-3xl">
                    Pulled server-side from{' '}
                    <code className="text-white/45">/api/arc-raiders/arcs</code>,{' '}
                    <code className="text-white/45">/quests</code>, and <code className="text-white/45">/traders</code>. Names
                    and snippets help you cross-check objectives before a raid; full text stays on MetaForge.
                </p>

                {!snapshot.ok ? (
                    <p className="text-sm text-amber-200/70 border border-amber-500/20 rounded-lg px-4 py-3 bg-amber-500/5">
                        MetaForge preview unavailable right now — try again later or open the reference link above.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="rounded-xl border border-white/[0.06] bg-black/35 p-5">
                            <h3 className="text-sm font-bold text-white/85 mb-3">Arcs (sample)</h3>
                            <ul className="space-y-3 text-sm text-white/60">
                                {snapshot.arcs.length === 0 ? (
                                    <li className="text-white/40">No arc names returned.</li>
                                ) : (
                                    snapshot.arcs.map((a) => (
                                        <li key={a.id ?? a.name} className="border-b border-white/[0.04] pb-3 last:border-0">
                                            <span className="font-semibold text-white/80">{a.name}</span>
                                            {a.descriptionSnippet ? (
                                                <p className="mt-1 text-xs text-white/45 leading-relaxed">{a.descriptionSnippet}</p>
                                            ) : null}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-black/35 p-5">
                            <h3 className="text-sm font-bold text-white/85 mb-3">Quests (sample)</h3>
                            <ul className="space-y-3 text-sm text-white/60">
                                {snapshot.quests.length === 0 ? (
                                    <li className="text-white/40">No quests returned.</li>
                                ) : (
                                    snapshot.quests.map((q) => (
                                        <li key={q.id} className="border-b border-white/[0.04] pb-3 last:border-0">
                                            <span className="font-semibold text-white/80">{q.name}</span>
                                            {q.traderName ? (
                                                <span className="text-white/35 text-xs ml-2">· {q.traderName}</span>
                                            ) : null}
                                            {q.objectivesPreview && q.objectivesPreview.length > 0 ? (
                                                <ul className="mt-1.5 text-xs text-white/40 list-disc list-inside space-y-0.5">
                                                    {q.objectivesPreview.map((o, i) => (
                                                        <li key={i}>{o}</li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </li>
                                    ))
                                )}
                            </ul>
                            <p className="text-xs text-white/35 mt-4">
                                Traders in rotation (count):{' '}
                                <span className="tabular-nums text-white/50">{snapshot.traderCount}</span>
                            </p>
                        </div>
                    </div>
                )}
            </section>

            <section aria-labelledby="community-guides-heading" className="mb-12">
                <h2 id="community-guides-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                    Community Guides
                </h2>
                <p className="text-sm text-white/55 mb-6 max-w-2xl">
                    Curated videos and articles from the wider community when you want a second opinion, a longer walkthrough, or a different voice.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {COMMUNITY_GUIDES.map((g) => (
                        <a
                            key={g.id}
                            href={g.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col rounded-xl border border-white/[0.08] overflow-hidden
                                       hover:border-yellow-400/30 hover:-translate-y-0.5 transition-all duration-200"
                            style={{ background: 'rgba(10,14,22,0.85)' }}
                        >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-white/[0.04] overflow-hidden">
                                {g.thumbnail.startsWith('http') ? (
                                    <img
                                        src={g.thumbnail}
                                        alt={g.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-white/20 text-3xl">
                                            {g.type === 'video' ? '▶' : '📝'}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold
                                                bg-black/70 backdrop-blur-sm"
                                     style={{ color: g.type === 'video' ? '#facc15' : 'rgba(255,255,255,0.65)' }}>
                                    {g.type === 'video' ? '▶ VIDEO' : '📝 ARTICLE'}
                                </div>
                            </div>
                            {/* Card body */}
                            <div className="flex flex-col flex-1 p-4 gap-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[10px] font-semibold text-yellow-400/75">{g.source}</p>
                                    <span className="text-[10px] text-white/28">·</span>
                                    <p className="text-[10px] text-white/34">{g.type === 'video' ? 'Watch externally' : 'Read externally'}</p>
                                </div>
                                <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2
                                               group-hover:text-white/90">{g.title}</h3>
                                <p className="text-xs text-white/55 leading-relaxed line-clamp-2 mt-0.5">{g.description}</p>
                                <p className="text-[10px] text-white/30 mt-auto pt-2">by {g.author}</p>
                            </div>
                        </a>
                    ))}
                </div>
                <p className="mt-6 text-xs text-white/35 text-center">
                    Want your guide featured?{' '}
                    <a href="https://reddit.com/r/ARCRaiders" target="_blank" rel="noopener noreferrer"
                       className="text-white/50 hover:text-white/70 underline underline-offset-2">
                        Post on r/ARCRaiders
                    </a>
                    {' '}or reach out on Discord.
                </p>
            </section>

            <footer className="pt-6 border-t border-white/[0.06] text-center text-xs text-white/40 leading-relaxed">
                {METAFORGE_GUIDES_ATTRIBUTION.short}.{' '}
                <a
                    href={METAFORGE_GUIDES_ATTRIBUTION.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rf-red/70 hover:text-rf-red underline underline-offset-2"
                >
                    metaforge.app/arc-raiders
                </a>
                {' · '}
                <a
                    href={METAFORGE_GUIDES_ATTRIBUTION.apiDocsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/45 hover:text-white/65 underline underline-offset-2"
                >
                    API reference
                </a>
            </footer>
        </div>
    )
}
