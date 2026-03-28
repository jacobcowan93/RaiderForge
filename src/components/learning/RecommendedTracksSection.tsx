'use client'

import Link from 'next/link'
import {
    getHubRecommendedPaths,
    estimatePathMinutes,
    getPathStepHref,
    getPathStepLabel,
} from '@/data/learningPaths'
import { DIFFICULTY_LABEL } from '@/data/learningShared'
import { useLearningProgress } from '@/lib/progression/learningProgressContext'

export function RecommendedTracksSection() {
    const { hydrated, pathCompletion, resetAll } = useLearningProgress()
    const paths = getHubRecommendedPaths()

    const onReset = () => {
        if (typeof window !== 'undefined' && window.confirm('Clear all saved learning progress on this device?')) {
            resetAll()
        }
    }

    return (
        <section aria-labelledby="recommended-tracks-heading" className="mb-12">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                <h2 id="recommended-tracks-heading" className="text-xs uppercase tracking-[0.2em] text-white/40 font-bold">
                    Recommended tracks
                </h2>
                <button
                    type="button"
                    onClick={onReset}
                    className="text-[10px] font-medium text-white/35 hover:text-white/55 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 rounded"
                    aria-label="Clear all learning progress stored on this device"
                >
                    Reset progress
                </button>
            </div>
            <p className="text-sm text-white/45 mb-6 max-w-2xl">
                Ordered playlists with a difficulty band and total focus time. Completion is tracked locally when you mark items
                done on each page.
            </p>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 list-none p-0 m-0">
                {paths.map((path) => {
                    const mins = estimatePathMinutes(path)
                    const stats = hydrated ? pathCompletion(path) : { completed: 0, total: path.steps.length, completedFocusMinutes: 0, totalMinutes: mins }
                    return (
                        <li
                            key={path.id}
                            className="rounded-xl border border-white/[0.08] bg-black/35 p-4 sm:p-5 flex flex-col min-w-0"
                        >
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-white/35 border border-white/10 rounded px-2 py-0.5">
                                    {DIFFICULTY_LABEL[path.difficultyBand]}
                                </span>
                                <span className="text-[10px] text-white/30 tabular-nums">
                                    ~{mins} min total
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{path.title}</h3>
                            <p className="text-sm text-white/50 leading-relaxed mb-3">{path.blurb}</p>
                            {hydrated ? (
                                <p className="text-xs text-emerald-200/55 font-medium mb-3" aria-live="polite">
                                    {stats.completed}/{stats.total} steps completed · ~{stats.completedFocusMinutes}/
                                    {stats.totalMinutes} min checked off
                                </p>
                            ) : (
                                <p className="text-xs text-white/30 mb-3">{path.steps.length} steps</p>
                            )}
                            <ol className="text-xs text-white/45 space-y-1.5 list-decimal list-inside mb-4 flex-1">
                                {path.steps.map((step, i) => (
                                    <li
                                        key={`${path.id}-${i}-${step.kind === 'trial' ? step.id : step.slug}`}
                                        className="break-words"
                                    >
                                        <Link
                                            href={getPathStepHref(step)}
                                            className="text-rf-red/85 hover:text-rf-red underline-offset-2 hover:underline"
                                        >
                                            {getPathStepLabel(step)}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
