import Link from 'next/link'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { TrialSummaryCard } from '@/components/learning/TrialSummaryCard'
import { TrialsHubClient } from '@/components/learning/TrialsHubClient'
import { MAPS } from '@/data/maps'
import { getAllTrialsCatalog, getAlternateTrialWeeks, getFeaturedTrialWeek } from '@/data/trials'
import { fetchCurrentEvents } from '@/lib/data/metaforge-events'
import { formatLiveHintForMap } from '@/lib/trials/liveMapTrialHint'
import { METAFORGE_GUIDES_ATTRIBUTION } from '@/lib/live-data/attribution'
import type { MfEvent } from '@/lib/events/conditions'

export const metadata = {
    title: 'Trials — Weekly Briefing | Raider Forge',
    description:
        'ARC Raiders weekly Trials: playlist order, full catalog with filters, and max-score briefings — with live zone hints when MetaForge data matches a map.',
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
    const alternates = getAlternateTrialWeeks()
    const catalog = getAllTrialsCatalog()
    const eventsPayload = await fetchCurrentEvents().catch(() => ({
        events: [] as MfEvent[],
        fetchedAt: new Date().toISOString(),
        upstreamOk: false,
    }))
    const now = new Date()
    const liveHints = buildLiveHints(catalog, now, eventsPayload.events, eventsPayload.upstreamOk)

    return (
        <div className="py-10 px-4 sm:px-6 max-w-4xl mx-auto">
            <header className="border-l-2 border-rf-red pl-5 mb-10">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-white tracking-tight">ARC Raiders Trials</h1>
                    <PageMaturityBadge level="beta" />
                </div>
                <p className="text-xs uppercase tracking-widest text-rf-red font-semibold mb-2">Weekly playlist</p>
                <p className="text-sm text-white/55 max-w-2xl leading-relaxed">
                    This week&apos;s order is your broadcast schedule; the catalog below is the full rotation library — filter by
                    difficulty, branch, or topic. Open any card for the full briefing. Live zone lines appear when MetaForge lines
                    up with a trial&apos;s primary map.
                </p>
                <p className="text-xs text-white/40 mt-3">
                    <Link href="/guides" className="text-rf-red/80 hover:text-rf-red font-semibold">
                        Prep guides →
                    </Link>
                </p>
            </header>

            <section aria-labelledby="this-week-heading" className="mb-12">
                <h2 id="this-week-heading" className="text-xs uppercase tracking-[0.2em] text-red-500 font-bold mb-1">
                    This week&apos;s trials
                </h2>
                <p className="text-sm text-white/45 mb-6">{featured.label}</p>
                {featured.seasonNote ? (
                    <p className="text-xs text-amber-200/55 border border-amber-500/15 rounded-lg px-3 py-2 mb-6 bg-amber-500/5">
                        {featured.seasonNote}
                    </p>
                ) : null}
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
                    Same trials as above, plus alternate-week entries — use filters to drill down.
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
                <h3 className="text-sm font-semibold text-white/80 mt-6 mb-2">By branch</h3>
                <ul className="grid sm:grid-cols-3 gap-3 text-xs text-white/55">
                    <li className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                        <span className="font-bold text-orange-200/90">Conditioning</span> — chain damage, manage cooldowns,
                        don&apos;t waste burst on immune phases.
                    </li>
                    <li className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                        <span className="font-bold text-sky-200/90">Mobility</span> — minimize idle steps; assign callouts for
                        carriables and elevation changes.
                    </li>
                    <li className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <span className="font-bold text-emerald-200/90">Survival</span> — spread for splash, bank heals for
                        predictable damage spikes.
                    </li>
                </ul>
            </section>

            {alternates.length > 0 ? (
                <section aria-labelledby="other-rotations-heading" className="mb-10">
                    <h2 id="other-rotations-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold mb-3">
                        Other example rotations
                    </h2>
                    <p className="text-xs text-white/35 mb-4">
                        Shown for structure only; featured week above is what we surface as &quot;this week&quot; from the local
                        catalog until a Trials API exists.
                    </p>
                    <ul className="space-y-2">
                        {alternates.map((w) => (
                            <li key={w.weekId} className="text-sm text-white/50 border-b border-white/[0.05] pb-2">
                                <span className="font-medium text-white/70">{w.label}</span>
                                <span className="text-white/35"> — {w.trials.map((t) => t.name).join(' · ')}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

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
    )
}
