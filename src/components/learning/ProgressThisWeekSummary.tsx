'use client'

import { buildFeaturedWeekProgressSteps } from '@/lib/progression/pathCompletion'
import { useLearningProgress } from '@/lib/progression/learningProgressContext'

type Props = {
    weekLabel: string
    featuredTrialIds: string[]
}

export function ProgressThisWeekSummary({ weekLabel, featuredTrialIds }: Props) {
    const { hydrated, stepsCompletion } = useLearningProgress()
    const steps = buildFeaturedWeekProgressSteps(featuredTrialIds)

    if (!hydrated) {
        return (
            <div
                className="mb-10 rounded-xl border border-white/[0.06] bg-black/30 px-4 py-4 text-xs text-white/40"
                aria-hidden
            >
                Loading weekly progress…
            </div>
        )
    }

    const s = stepsCompletion(steps)

    return (
        <section
            className="mb-10 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-4 sm:px-5 sm:py-5"
            aria-labelledby="progress-this-week-heading"
        >
            <h2 id="progress-this-week-heading" className="text-xs uppercase tracking-[0.2em] text-red-400/90 font-bold mb-2">
                Progress this week
            </h2>
            <p className="text-[11px] text-white/40 mb-3">{weekLabel}</p>
            <p className="text-sm text-white/75" aria-live="polite">
                <span className="font-semibold text-white tabular-nums">
                    {s.completed}/{s.total}
                </span>{' '}
                steps in this week&apos;s track (prep guide + featured trials) marked complete.
            </p>
            <p className="text-xs text-white/45 mt-2">
                ~<span className="tabular-nums text-white/55">{s.completedFocusMinutes}</span> /{' '}
                <span className="tabular-nums text-white/55">{s.totalMinutes}</span> min focus time from those completions.
            </p>
        </section>
    )
}
