import Image from 'next/image'
import Link from 'next/link'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { getMapById, MAPS } from '@/data/maps'
import { getAlternateTrialWeeks, getFeaturedTrialWeek, type TrialBranch, type WeeklyTrial } from '@/data/trials'
import { fetchCurrentEvents } from '@/lib/data/metaforge-events'
import { getLiveMapConditions } from '@/lib/live-data/mapConditions'
import { mapCoverPath } from '@/lib/maps/mapCovers'
import { METAFORGE_GUIDES_ATTRIBUTION } from '@/lib/live-data/attribution'

export const metadata = {
    title: 'Trials — Weekly Briefing | Raider Forge',
    description:
        'ARC Raiders weekly Trials briefing: maps, modifiers, scoring focus, and max-score strategies — with live zone context when MetaForge data is available.',
}

const BRANCH_STYLE: Record<TrialBranch, string> = {
    conditioning: 'border-orange-500/35 bg-orange-500/10 text-orange-100/90',
    mobility: 'border-sky-500/35 bg-sky-500/10 text-sky-100/90',
    survival: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100/90',
}

function LiveLine({ label, line }: { label: string; line: string }) {
    return (
        <p className="text-[11px] text-white/38 mt-2 border-l border-white/10 pl-2">
            <span className="text-white/45 font-medium">{label} live: </span>
            {line}
        </p>
    )
}

function TrialCard({
    trial,
    liveLine,
}: {
    trial: WeeklyTrial
    liveLine: string | null
}) {
    const map = trial.mapRfId ? getMapById(trial.mapRfId) : undefined
    const cover = trial.mapRfId ? mapCoverPath(trial.mapRfId) : undefined
    const mapName = map?.displayName ?? 'Open maps'

    return (
        <article className="rounded-xl border border-white/[0.08] bg-black/40 overflow-hidden flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-[min(44%,220px)] shrink-0 aspect-[16/10] sm:aspect-auto sm:min-h-[200px] bg-rf-bgSoft">
                {cover ? (
                    <Image
                        src={cover}
                        alt={`${mapName} — trial zone preview`}
                        fill
                        className="object-cover opacity-90"
                        sizes="(max-width: 640px) 100vw, 220px"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/25 text-xs px-4 text-center">
                        Multi-zone trial — see strategy below
                    </div>
                )}
                {trial.iconSrc ? (
                    <div className="absolute bottom-2 left-2 w-10 h-10 rounded-lg bg-black/70 border border-white/10 p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={trial.iconSrc} alt="" className="w-full h-full object-contain" />
                    </div>
                ) : null}
            </div>
            <div className="flex-1 p-4 sm:p-5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                        className={`text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5 border ${BRANCH_STYLE[trial.branch]}`}
                    >
                        {trial.branch}
                    </span>
                    {trial.mapRfId ? (
                        <Link
                            href={`/maps/${trial.mapRfId}`}
                            className="text-[11px] font-semibold text-rf-red/90 hover:text-rf-red"
                        >
                            Tactical map →
                        </Link>
                    ) : (
                        <Link href="/maps" className="text-[11px] font-semibold text-rf-red/90 hover:text-rf-red">
                            Maps hub →
                        </Link>
                    )}
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">{trial.name}</h3>
                <p className="text-xs text-white/45 mt-1">{mapName}</p>
                <dl className="mt-4 space-y-3 text-sm">
                    <div>
                        <dt className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">Modifiers</dt>
                        <dd className="text-white/65 leading-relaxed">{trial.modifiersSummary}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">Scoring focus</dt>
                        <dd className="text-white/65 leading-relaxed">{trial.scoringFocus}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] uppercase tracking-wider text-emerald-200/50 font-semibold">
                            Max score playbook
                        </dt>
                        <dd className="text-white/75 leading-relaxed">{trial.maxScoreTips}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] uppercase tracking-wider text-red-300/50 font-semibold">Avoid</dt>
                        <dd className="text-white/55 leading-relaxed">{trial.avoid}</dd>
                    </div>
                    <div>
                        <dt className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">Role hint</dt>
                        <dd className="text-white/65 leading-relaxed">{trial.roleHint}</dd>
                    </div>
                </dl>
                {liveLine ? <LiveLine label={mapName} line={liveLine} /> : null}
            </div>
        </article>
    )
}

function formatLiveHint(mapId: string, now: Date, events: import('@/lib/events/conditions').MfEvent[], upstreamOk: boolean): string | null {
    const cond = getLiveMapConditions(mapId, now, events, upstreamOk)
    if (cond.source === 'api' && cond.activeConditions.length > 0) {
        return `${cond.activeConditions.join(', ')} (MetaForge schedule) — factor into route timing.`
    }
    if (cond.source === 'rotation-fallback' && cond.activeConditions.length > 0) {
        return `${cond.activeConditions.join(', ')} (rotation fallback) — verify in-raid.`
    }
    return null
}

export default async function TrialsPage() {
    const featured = getFeaturedTrialWeek()
    const alternates = getAlternateTrialWeeks()
    const eventsPayload = await fetchCurrentEvents().catch(() => ({
        events: [] as import('@/lib/events/conditions').MfEvent[],
        fetchedAt: new Date().toISOString(),
        upstreamOk: false,
    }))
    const now = new Date()
    const upstream = eventsPayload.upstreamOk

    return (
        <div className="py-10 px-4 sm:px-6 max-w-4xl mx-auto">
            <header className="border-l-2 border-rf-red pl-5 mb-10">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-white tracking-tight">ARC Raiders Trials</h1>
                    <PageMaturityBadge level="beta" />
                </div>
                <p className="text-lg font-semibold text-white/75">Weekly briefing</p>
                <p className="text-sm text-white/55 mt-3 max-w-2xl leading-relaxed">
                    What this week&apos;s trial types reward, where they play best, and how to push scores — with optional
                    live zone context from MetaForge when it matches a map.
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
                <div className="space-y-6">
                    {featured.trials.map((trial) => {
                        const liveLine =
                            trial.mapRfId != null
                                ? formatLiveHint(trial.mapRfId, now, eventsPayload.events, upstream)
                                : null
                        return <TrialCard key={trial.id} trial={trial} liveLine={liveLine} />
                    })}
                </div>
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
