import Link from 'next/link'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { ProgressThisWeekSummary } from '@/components/learning/ProgressThisWeekSummary'
import { RecommendedTracksSection } from '@/components/learning/RecommendedTracksSection'
import { TrialSummaryCard } from '@/components/learning/TrialSummaryCard'
import { TrialsHubClient } from '@/components/learning/TrialsHubClient'
import { TrialCommandCard } from '@/components/trials/TrialCommandCard'
import { TrialsHeroCountdown } from '@/components/trials/TrialsHeroCountdown'
import { MAPS } from '@/data/maps'
import { getAllTrialsCatalog, getFeaturedTrialWeek } from '@/data/trials'
import { fetchCurrentEvents } from '@/lib/data/metaforge-events'
import { formatLiveHintForMap } from '@/lib/trials/liveMapTrialHint'
import { getNextUtcMondayMidnightMs } from '@/lib/trials/weeklyReset'
import { getNextWeekPresentation, getThisWeekPresentation, TRIALS_PAGE_MATURITY } from '@/lib/trials/trialsData'
import { METAFORGE_GUIDES_ATTRIBUTION } from '@/lib/live-data/attribution'
import type { MfEvent } from '@/lib/events/conditions'

export const metadata = {
    title: 'Weekly Trials — Command Center | Raider Forge',
    description:
        'This week’s rotation, countdown to reset, max-score tips, and links to the full catalog — with live zone hints when MetaForge matches a map.',
}

function buildLiveHints(
    catalog: ReturnType<typeof getAllTrialsCatalog>,
    now: Date,
    events: MfEvent[],
    upstreamOk: boolean,
): Record<string, string | null> {
    const out: Record<string, string | null> = {}
    for (const t of catalog) {
        out[t.id] = t.mapRfId ? formatLiveHintForMap(t.mapRfId, now, events, upstreamOk) : null
    }
    return out
}

export default async function TrialsPage() {
    const featured = getFeaturedTrialWeek()
    const catalog = getAllTrialsCatalog()
    const thisWeek = getThisWeekPresentation()
    const nextWeek = getNextWeekPresentation()

    const eventsPayload = await fetchCurrentEvents().catch(() => ({
        events: [] as MfEvent[],
        fetchedAt: new Date().toISOString(),
        upstreamOk: false,
    }))
    const now = new Date()
    const liveHints = buildLiveHints(catalog, now, eventsPayload.events, eventsPayload.upstreamOk)
    const resetMs = getNextUtcMondayMidnightMs(now)

    return (
        <div className="relative">
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-[0.45] bg-[linear-gradient(rgba(56,189,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] bg-[length:32px_32px]"
                aria-hidden
            />
            <div className="relative z-10 py-10 px-4 sm:px-6 max-w-7xl mx-auto">
                {/* Hero */}
                <header className="relative mb-12 overflow-hidden rounded-2xl border border-blue-950/35 border-t-rf-red/30 bg-[#050810]/75 shadow-2xl shadow-black/50">
                    <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rf-red/10 via-transparent to-sky-950/10"
                        aria-hidden
                    />
                    <div className="relative px-5 py-8 sm:px-10 sm:py-10">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-rf-red font-bold">Operations</p>
                            <PageMaturityBadge level={TRIALS_PAGE_MATURITY} />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-rf-red drop-shadow-[0_2px_24px_rgba(255,64,64,0.25)]">
                            Weekly Trials
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/75 leading-relaxed">
                            Command-center brief: rotation preview, max-score focus, and quick links — then drill into the full
                            catalog and live zone hints when MetaForge lines up with a trial&apos;s map.
                        </p>
                        <div className="mt-8 flex flex-col items-start gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <TrialsHeroCountdown
                                targetEpochMs={resetMs}
                                metaforgeUpstreamOk={eventsPayload.upstreamOk}
                            />
                            <div className="text-[10px] uppercase tracking-widest text-white/35 lg:text-right">
                                <p>Playlist sync</p>
                                <p className="mt-1 font-mono text-[11px] text-white/50 normal-case tracking-normal">
                                    {featured.label}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <ProgressThisWeekSummary weekLabel={featured.label} featuredTrialIds={featured.trials.map((t) => t.id)} />

                <RecommendedTracksSection />

                {/* This week — tactical cards */}
                <section aria-labelledby="this-week-heading" className="mb-14">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 id="this-week-heading" className="text-xs uppercase tracking-[0.2em] text-rf-red font-bold">
                                This Week&apos;s Trials
                            </h2>
                            <p className="mt-1 text-sm text-white/50">{thisWeek.label}</p>
                            {thisWeek.subtitle ? (
                                <p className="mt-2 max-w-2xl text-xs text-amber-200/55 border border-amber-500/15 rounded-lg px-3 py-2 bg-amber-500/5">
                                    {thisWeek.subtitle}
                                </p>
                            ) : null}
                        </div>
                        <Link
                            href="/guides"
                            className="text-xs font-semibold text-sky-300/80 hover:text-sky-200 transition-colors shrink-0"
                        >
                            Prep guides →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                        {thisWeek.trials.map((trial) => (
                            <TrialCommandCard key={trial.trialId ?? trial.name} trial={trial} />
                        ))}
                    </div>
                </section>

                {/* Next week */}
                <section aria-labelledby="next-week-heading" className="mb-14">
                    <div className="mb-6">
                        <h2 id="next-week-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">
                            Next Week&apos;s Trials
                        </h2>
                        <p className="mt-1 text-sm text-white/50">{nextWeek.label}</p>
                        {nextWeek.subtitle ? <p className="mt-2 text-xs text-white/35 max-w-2xl">{nextWeek.subtitle}</p> : null}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                        {nextWeek.trials.map((trial) => (
                            <TrialCommandCard key={`next-${trial.trialId ?? trial.name}`} trial={trial} />
                        ))}
                    </div>
                </section>

                {/* Live map hints — compact list */}
                <section aria-labelledby="live-playlist-heading" className="mb-12">
                    <h2 id="live-playlist-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-2">
                        This week&apos;s playlist (with live hints)
                    </h2>
                    <p className="text-sm text-white/45 mb-6">
                        Same rotation as above — with map thumbnails and MetaForge zone lines when available.
                    </p>
                    <ul className="space-y-4 list-none p-0 m-0">
                        {featured.trials.map((trial) => (
                            <li key={trial.id}>
                                <TrialSummaryCard trial={trial} liveHint={liveHints[trial.id] ?? null} emphasize />
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-labelledby="catalog-heading" className="mb-12">
                    <h2 id="catalog-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-2">
                        Full catalog
                    </h2>
                    <p className="text-sm text-white/45 mb-2">
                        All trials in rotation — filter by difficulty, branch, or topic. Open any row for the long-form briefing.
                    </p>
                    <TrialsHubClient liveHints={liveHints} />
                </section>

                <section aria-labelledby="scoring-tips-heading" className="mb-12 rounded-xl border border-white/[0.06] bg-black/35 p-5 sm:p-6">
                    <h2 id="scoring-tips-heading" className="text-lg font-bold text-white mb-4">
                        Scoring tips (all Trials)
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-sm text-white/60 leading-relaxed">
                        <li>
                            <strong className="text-white/75">Time vs survival:</strong> know whether the clock or staying alive
                            drives the multiplier — don&apos;t farm kills if checkpoints pay more.
                        </li>
                        <li>
                            <strong className="text-white/75">Objectives first:</strong> partial clears often score worse than one
                            perfect segment; reset deliberately if the mode allows.
                        </li>
                        <li>
                            <strong className="text-white/75">Branch synergy:</strong> Conditioning handles burst windows, Mobility
                            secures routes and deliveries, Survival stabilizes attrition — mix roles instead of stacking one branch.
                        </li>
                        <li>
                            <strong className="text-white/75">Live conditions:</strong> when MetaForge shows zone modifiers, adjust
                            pathing before you adjust loadouts — rotating around a storm beats tanking it blind.
                        </li>
                    </ul>
                </section>

                <section className="mb-8 rounded-xl border border-white/[0.06] p-4 bg-black/25">
                    <h2 className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-2">All zones</h2>
                    <ul className="flex flex-wrap gap-2">
                        {MAPS.map((m) => (
                            <li key={m.id}>
                                <Link
                                    href={`/maps/${m.id}`}
                                    className="inline-block text-xs font-medium text-rf-red/85 hover:text-rf-red border border-white/10 rounded-full px-3 py-1"
                                >
                                    {m.displayName}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <footer className="pt-4 border-t border-white/[0.06] text-center text-xs text-white/40">
                    Live schedule data from MetaForge when available — see also{' '}
                    <Link href="/maps" className="text-rf-red/70 hover:text-rf-red underline underline-offset-2">
                        Maps
                    </Link>{' '}
                    and{' '}
                    <a
                        href={METAFORGE_GUIDES_ATTRIBUTION.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rf-red/70 hover:text-rf-red underline underline-offset-2"
                    >
                        MetaForge ARC Raiders
                    </a>
                    .
                </footer>
            </div>
        </div>
    )
}
