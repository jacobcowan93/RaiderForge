import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { TrialCommandCard } from '@/components/trials/TrialCommandCard'
import { TrialsHeroCountdown } from '@/components/trials/TrialsHeroCountdown'
import { getFeaturedTrialWeek } from '@/data/trials'
import { fetchCurrentEvents } from '@/lib/data/metaforge-events'
import { getWeeklyTrialsForPage } from '@/lib/trials/metaforgeWeeklyTrials'
import { getNextUtcMondayMidnightMs, getUtcMondayMidnightOfCurrentWeekMs } from '@/lib/trials/weeklyReset'
import { TRIALS_PAGE_MATURITY } from '@/lib/trials/trialsData'

export const metadata = {
    title: 'Weekly Trials — Command Center | Raider Forge',
    description:
        'This week and next week ARC Raiders Trials rotations, max-score tips, and reset countdown — tactical brief only.',
}

function formatUtcWeekOfLabel(now: Date): string {
    const mon = new Date(getUtcMondayMidnightOfCurrentWeekMs(now))
    const sun = new Date(mon)
    sun.setUTCDate(sun.getUTCDate() + 6)
    const o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' }
    const y = mon.getUTCFullYear()
    return `Week of ${mon.toLocaleDateString('en-US', o)} – ${sun.toLocaleDateString('en-US', o)}, ${y} (UTC)`
}

function formatLastUpdated(now: Date): string {
    return `Last updated ${now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC`
}

function fmtMfWindow(iso: string | null): string | null {
    if (!iso) return null
    return (
        new Date(iso).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC',
        }) + ' UTC'
    )
}

export default async function TrialsPage() {
    const now = new Date()
    const weekly = await getWeeklyTrialsForPage(now)
    const { thisWeek, nextWeek, metaforgeDebugLine } = weekly

    const eventsPayload = await fetchCurrentEvents().catch(() => ({
        events: [],
        upstreamOk: false,
    }))
    const resetMs = getNextUtcMondayMidnightMs(now)
    const featured = getFeaturedTrialWeek(now)

    const activeLine =
        weekly.source === 'metaforge' && weekly.activeWindowEnd
            ? `This rotation resets ${fmtMfWindow(weekly.activeWindowEnd)}.`
            : weekly.source === 'metaforge' && weekly.nextWindowStart
              ? `Next window starts ${fmtMfWindow(weekly.nextWindowStart)}.`
              : `Active catalog week: ${featured.label}`

    return (
        <div className="relative">
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-[0.45] bg-[linear-gradient(rgba(56,189,248,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.04)_1px,transparent_1px)] bg-[length:32px_32px]"
                aria-hidden
            />
            <div className="relative z-10 py-8 px-4 sm:px-6 max-w-7xl mx-auto">
                <header className="relative mb-8 overflow-hidden rounded-2xl border border-blue-950/35 border-t-rf-red/30 bg-[#050810]/75 shadow-2xl shadow-black/50">
                    <div
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rf-red/10 via-transparent to-sky-950/10"
                        aria-hidden
                    />
                    <div className="relative px-5 py-6 sm:px-8 sm:py-8">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-rf-red font-bold">Operations</p>
                            <PageMaturityBadge level={TRIALS_PAGE_MATURITY} />
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-rf-red drop-shadow-[0_2px_24px_rgba(255,64,64,0.25)]">
                            Weekly Trials
                        </h1>
                        <p className="mt-2 max-w-2xl text-xs sm:text-sm text-white/65 leading-relaxed">
                            This week&apos;s rotation and the next — max-score focus, no extra clutter.
                        </p>

                        <div className="mt-6">
                            <TrialsHeroCountdown
                                targetEpochMs={resetMs}
                                metaforgeUpstreamOk={eventsPayload.upstreamOk}
                            />
                        </div>

                        <div
                            className="mx-auto mt-4 h-[3px] max-w-2xl rounded-full bg-gradient-to-r from-transparent via-rf-red/90 to-transparent shadow-[0_0_16px_-2px_rgba(239,68,68,0.45)]"
                            aria-hidden
                        />

                        <div className="mt-5 flex flex-col gap-1.5 border-t border-white/[0.08] pt-5">
                            <p className="text-sm font-semibold leading-snug text-white/92 sm:text-base">
                                {formatUtcWeekOfLabel(now)}
                            </p>
                            <p className="text-xs tabular-nums text-white/65 sm:text-sm">{formatLastUpdated(now)}</p>
                            <p className="text-xs text-white/50 sm:text-[13px]">
                                {weekly.source === 'metaforge' ? (
                                    <>
                                        Live schedule:{' '}
                                        <span className="font-medium text-white/80">{activeLine}</span>
                                    </>
                                ) : (
                                    <>
                                        Active rotation: <span className="font-medium text-white/80">{activeLine}</span>
                                    </>
                                )}
                            </p>
                            <p
                                className="mt-2 rounded border border-amber-500/25 bg-amber-950/20 px-2 py-1 font-mono text-[10px] leading-snug text-amber-100/80 [word-break:break-word]"
                                title="Temporary MetaForge week verification — remove after validation"
                            >
                                {metaforgeDebugLine}
                            </p>
                        </div>
                    </div>
                </header>

                <section aria-labelledby="this-week-heading" className="mb-10">
                    <div className="mb-4">
                        <h2 id="this-week-heading" className="text-[11px] uppercase tracking-[0.2em] text-rf-red font-bold">
                            This Week&apos;s Trials
                        </h2>
                        <p className="mt-1 text-xs text-white/45">{thisWeek.label}</p>
                        {thisWeek.subtitle ? (
                            <p className="mt-0.5 text-[11px] text-white/35">{thisWeek.subtitle}</p>
                        ) : null}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                        {thisWeek.trials.map((trial, i) => (
                            <TrialCommandCard
                                key={trial.sourceRowId ?? trial.trialId ?? `this-${trial.name}-${i}`}
                                trial={trial}
                            />
                        ))}
                    </div>
                </section>

                <section aria-labelledby="next-week-heading" className="mb-6">
                    <div
                        className="mt-10 h-1 w-full rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400"
                        aria-hidden
                    />
                    <div className="mb-4 mt-4">
                        <h2
                            id="next-week-heading"
                            className="text-xs font-semibold tracking-[0.16em] text-amber-300 sm:text-sm"
                        >
                            NEXT WEEK&apos;S TRIALS
                        </h2>
                        <p className="mt-1 text-xs text-white/45">{nextWeek.label}</p>
                        {nextWeek.subtitle ? (
                            <p className="mt-0.5 text-[11px] text-white/35">{nextWeek.subtitle}</p>
                        ) : null}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                        {nextWeek.trials.map((trial, i) => (
                            <TrialCommandCard
                                key={trial.sourceRowId ?? trial.trialId ?? `next-${trial.name}-${i}`}
                                trial={trial}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
