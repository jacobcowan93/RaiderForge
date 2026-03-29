import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { TrialCommandCard } from '@/components/trials/TrialCommandCard'
import { TrialsHeroCountdown } from '@/components/trials/TrialsHeroCountdown'
import { getFeaturedTrialWeek } from '@/data/trials'
import { fetchCurrentEvents } from '@/lib/data/metaforge-events'
import { getNextUtcMondayMidnightMs, getUtcMondayMidnightOfCurrentWeekMs } from '@/lib/trials/weeklyReset'
import { getNextWeekPresentation, getThisWeekPresentation, TRIALS_PAGE_MATURITY } from '@/lib/trials/trialsData'

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

export default async function TrialsPage() {
    const now = new Date()
    const featured = getFeaturedTrialWeek(now)
    const thisWeek = getThisWeekPresentation(now)
    const nextWeek = getNextWeekPresentation(now)

    const eventsPayload = await fetchCurrentEvents().catch(() => ({
        events: [],
        upstreamOk: false,
    }))
    const resetMs = getNextUtcMondayMidnightMs(now)

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

                        <div className="mt-4 flex flex-col gap-1 border-t border-white/[0.06] pt-4 text-[10px] sm:text-[11px] text-white/45">
                            <p className="font-medium text-white/70">{formatUtcWeekOfLabel(now)}</p>
                            <p className="tabular-nums text-white/40">{formatLastUpdated(now)}</p>
                            <p className="text-white/35">
                                Active rotation: <span className="text-white/55">{featured.label}</span>
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {thisWeek.trials.map((trial) => (
                            <TrialCommandCard key={trial.trialId ?? trial.name} trial={trial} />
                        ))}
                    </div>
                </section>

                <section aria-labelledby="next-week-heading" className="mb-6">
                    <div className="mb-4">
                        <h2 id="next-week-heading" className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold">
                            Next Week&apos;s Trials
                        </h2>
                        <p className="mt-1 text-xs text-white/45">{nextWeek.label}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {nextWeek.trials.map((trial) => (
                            <TrialCommandCard key={`next-${trial.trialId ?? trial.name}`} trial={trial} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
