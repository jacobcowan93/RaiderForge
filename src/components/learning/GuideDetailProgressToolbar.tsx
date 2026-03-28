'use client'

import { useState } from 'react'
import type { LearningItemStatus } from '@/lib/progression/localProgressStore'
import { MAX_ACTIVE_GUIDES, MAX_IN_PROGRESS_STARTS_PER_WEEK } from '@/lib/progression/localProgressStore'
import { useLearningProgress } from '@/lib/progression/learningProgressContext'

type Props = {
    slug: string
    title: string
}

function statusLabel(s: LearningItemStatus): string {
    if (s === 'not_started') return 'Not started'
    if (s === 'in_progress') return 'In progress'
    return 'Completed'
}

export function GuideDetailProgressToolbar({ slug, title }: Props) {
    const { hydrated, getGuideStatus, setGuideStatus, activeGuideCount, inProgressStartsThisWeek } = useLearningProgress()
    const [error, setError] = useState('')

    if (!hydrated) {
        return (
            <div className="rounded-lg border border-white/[0.06] bg-black/30 p-4 text-xs text-white/40" aria-hidden>
                Loading progress…
            </div>
        )
    }

    const status = getGuideStatus(slug)
    const atActiveCap = status !== 'in_progress' && activeGuideCount >= MAX_ACTIVE_GUIDES
    const atWeeklyCap = status !== 'in_progress' && inProgressStartsThisWeek >= MAX_IN_PROGRESS_STARTS_PER_WEEK
    const disableMarkActive = atActiveCap || atWeeklyCap

    const apply = (next: LearningItemStatus) => {
        setError('')
        const r = setGuideStatus(slug, next)
        if (r.ok === false) setError(r.error)
    }

    return (
        <div
            className="rounded-lg border border-white/[0.08] bg-black/35 p-4 space-y-3"
            role="region"
            aria-label={`Progress for ${title}`}
        >
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Your progress</span>
                <span className="text-xs text-white/60">{statusLabel(status)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={disableMarkActive}
                    onClick={() => apply('in_progress')}
                    className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                    aria-label={
                        atWeeklyCap
                            ? `Cannot mark active: weekly new active limit ${MAX_IN_PROGRESS_STARTS_PER_WEEK} reached`
                            : atActiveCap
                              ? `Cannot mark active: already ${MAX_ACTIVE_GUIDES} guides active`
                              : `Mark guide ${title} as in progress`
                    }
                    aria-pressed={status === 'in_progress'}
                >
                    Mark active
                </button>
                <button
                    type="button"
                    onClick={() => apply('completed')}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100/90 hover:bg-emerald-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                    aria-label={`Mark guide ${title} as completed`}
                    aria-pressed={status === 'completed'}
                >
                    Mark completed
                </button>
                <button
                    type="button"
                    onClick={() => apply('not_started')}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white/50 hover:text-white/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    aria-label={`Clear progress for ${title}`}
                >
                    Clear
                </button>
            </div>
            {atActiveCap ? (
                <p className="text-[11px] text-amber-200/70">
                    Active guide cap reached ({MAX_ACTIVE_GUIDES}). Complete or clear another guide first.
                </p>
            ) : null}
            {atWeeklyCap && !atActiveCap ? (
                <p className="text-[11px] text-amber-200/70">
                    Weekly focus cap reached ({MAX_IN_PROGRESS_STARTS_PER_WEEK} new active starts). Complete items or wait for the
                    next week.
                </p>
            ) : null}
            {error ? (
                <p className="text-[11px] text-amber-200/80" role="status" aria-live="polite">
                    {error}
                </p>
            ) : null}
            <p className="text-[10px] text-white/30">
                Weekly new &quot;active&quot; starts: max {MAX_IN_PROGRESS_STARTS_PER_WEEK} combined (guides + trials). Stored
                only on this device.
            </p>
        </div>
    )
}
