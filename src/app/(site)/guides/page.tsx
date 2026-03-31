import Link from 'next/link'
import { GuidesHubClient } from '@/components/learning/GuidesHubClient'
import { ProgressThisWeekSummary } from '@/components/learning/ProgressThisWeekSummary'
import { RecommendedTracksSection } from '@/components/learning/RecommendedTracksSection'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { getFeaturedTrialWeek } from '@/data/trials'
import { GUIDE_ARTICLES, GUIDE_HUB_SHORTCUTS } from '@/data/guides'
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

export default async function GuidesPage() {
    const snapshot = await fetchMetaforgeGuidesSnapshot()
    const featuredTrialsWeek = getFeaturedTrialWeek()

    return (
        <div className="py-10 px-4 sm:px-6 max-w-6xl mx-auto">
            <header className="border-l-2 border-rf-red pl-5 mb-10">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-white tracking-tight">Guides</h1>
                    <PageMaturityBadge level="beta" />
                </div>
                <p className="text-xs uppercase tracking-widest text-rf-red font-semibold mb-2">Briefings</p>
                <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
                    Short, trustworthy write-ups you can skim before a run: maps workflow, Trials prep, economy habits, and how
                    live conditions behave. Filter by difficulty or topic; each guide opens as a single readable page. For raw
                    quest and arc data, we still mirror a live snapshot from{' '}
                    <a
                        href={METAFORGE_GUIDES_ATTRIBUTION.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rf-red/90 hover:text-rf-red underline underline-offset-2"
                    >
                        MetaForge
                    </a>{' '}
                    below.
                </p>
                <p className="text-xs text-white/40 mt-3">
                    <Link href="/trials" className="text-rf-red/80 hover:text-rf-red font-semibold">
                        Weekly Trials playlist →
                    </Link>
                </p>
            </header>

            <ProgressThisWeekSummary
                weekLabel={featuredTrialsWeek.label}
                featuredTrialIds={featuredTrialsWeek.trials.map((t) => t.id)}
            />

            <RecommendedTracksSection heading="Starter playlists" />

            <section aria-labelledby="shortcuts-heading" className="mb-12">
                <h2 id="shortcuts-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-4">
                    Start here
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {GUIDE_HUB_SHORTCUTS.map((tile) => {
                        const CardInner = (
                            <>
                                <h3 className="text-lg font-bold text-white mb-2">{tile.title}</h3>
                                <p className="text-sm text-white/55 leading-relaxed mb-4">{tile.summary}</p>
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rf-red/95">
                                    {tile.cta}
                                    <span aria-hidden>→</span>
                                </span>
                            </>
                        )
                        const cardClass =
                            'block h-full rounded-xl border border-white/[0.08] bg-black/40 hover:border-red-500/35 hover:bg-black/55 p-5 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50'

                        if (tile.variant === 'metaforge') {
                            return (
                                <a
                                    key={tile.id}
                                    href={tile.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cardClass}
                                >
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

            <section aria-labelledby="catalog-heading" className="mb-14">
                <h2 id="catalog-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-2">
                    All guides
                </h2>
                <p className="text-sm text-white/45 mb-6 max-w-2xl">
                    Use quick entry for difficulty bands, or filter by topic. Cards show read time and type (guide, tutorial,
                    reference).
                </p>
                <GuidesHubClient articles={GUIDE_ARTICLES} />
            </section>

            <section aria-labelledby="metaforge-data-heading" className="mb-10">
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

            {/* ── Community guides: curated external videos + articles ─────────── */}
            <section aria-labelledby="community-guides-heading" className="mb-12">
                <h2 id="community-guides-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-1">
                    Community Guides
                </h2>
                <p className="text-sm text-white/55 mb-6 max-w-2xl">
                    Curated videos and articles from the community — full beginner breakdowns, progression tips, and advanced tricks.
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
                                <p className="text-[10px] font-semibold text-yellow-400/75">{g.source}</p>
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
