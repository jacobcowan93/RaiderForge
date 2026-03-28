'use client'

import { useMemo, useState } from 'react'
import type { TrialBranch, WeeklyTrial } from '@/data/trials'
import { getAllTrialsCatalog } from '@/data/trials'
import type { LearningDifficulty, LearningTag } from '@/data/learningShared'
import { DIFFICULTY_LABEL, LEARNING_TAG_LABEL } from '@/data/learningShared'
import { TrialSummaryCard } from '@/components/learning/TrialSummaryCard'
import { useLearningProgress } from '@/lib/progression/learningProgressContext'

type Props = {
    liveHints: Record<string, string | null>
}

const BRANCHES: TrialBranch[] = ['conditioning', 'mobility', 'survival']
const DIFFICULTIES: LearningDifficulty[] = ['onboarding', 'casual', 'advanced']

function allTagsFromCatalog(catalog: WeeklyTrial[]): LearningTag[] {
    const s = new Set<LearningTag>()
    for (const t of catalog) {
        for (const tag of t.tags) s.add(tag)
    }
    return [...s].sort()
}

export function TrialsHubClient({ liveHints }: Props) {
    const { hydrated, getTrialStatus } = useLearningProgress()
    const catalog = useMemo(() => getAllTrialsCatalog(), [])
    const tagOptions = useMemo(() => allTagsFromCatalog(catalog), [catalog])

    const [branch, setBranch] = useState<TrialBranch | 'all'>('all')
    const [difficulty, setDifficulty] = useState<LearningDifficulty | 'all'>('all')
    const [tag, setTag] = useState<LearningTag | 'all'>('all')
    const [hideCompleted, setHideCompleted] = useState(false)

    const filtered = useMemo(() => {
        return catalog.filter((t) => {
            if (branch !== 'all' && t.branch !== branch) return false
            if (difficulty !== 'all' && t.difficulty !== difficulty) return false
            if (tag !== 'all' && !t.tags.includes(tag)) return false
            if (hydrated && hideCompleted && getTrialStatus(t.id) === 'completed') return false
            return true
        })
    }, [catalog, branch, difficulty, tag, getTrialStatus, hideCompleted, hydrated])

    return (
        <div>
            <div className="flex flex-col gap-4 mb-6">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Quick entry</p>
                    <div className="flex flex-wrap gap-2">
                        {DIFFICULTIES.map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => {
                                    setDifficulty(d)
                                    setBranch('all')
                                    setTag('all')
                                }}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                    difficulty === d && branch === 'all' && tag === 'all'
                                        ? 'border-red-500/50 bg-red-500/15 text-white'
                                        : 'border-white/10 bg-black/30 text-white/60 hover:border-white/20'
                                }`}
                            >
                                {DIFFICULTY_LABEL[d]}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setBranch('all')
                                setDifficulty('all')
                                setTag('all')
                            }}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                                branch === 'all' && difficulty === 'all' && tag === 'all'
                                    ? 'border-white/25 bg-white/10 text-white'
                                    : 'border-white/10 bg-black/30 text-white/60'
                            }`}
                        >
                            Full playlist
                        </button>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Branch</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setBranch('all')}
                            className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${
                                branch === 'all' ? 'border-red-500/45 bg-red-500/10 text-white' : 'border-white/10 text-white/50'
                            }`}
                        >
                            All
                        </button>
                        {BRANCHES.map((b) => (
                            <button
                                key={b}
                                type="button"
                                onClick={() => setBranch(b)}
                                className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${
                                    branch === b ? 'border-red-500/45 bg-red-500/10 text-white' : 'border-white/10 text-white/50'
                                }`}
                            >
                                {b}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Topic</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setTag('all')}
                            className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                                tag === 'all' ? 'border-red-500/45 bg-red-500/10 text-white' : 'border-white/10 text-white/50'
                            }`}
                        >
                            All topics
                        </button>
                        {tagOptions.map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTag(t)}
                                className={`rounded-full border px-3 py-1 text-[11px] font-medium max-w-[180px] truncate ${
                                    tag === t ? 'border-red-500/45 bg-red-500/10 text-white' : 'border-white/10 text-white/50'
                                }`}
                            >
                                {LEARNING_TAG_LABEL[t]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        id="trials-hide-completed"
                        type="checkbox"
                        checked={hideCompleted}
                        onChange={(e) => setHideCompleted(e.target.checked)}
                        disabled={!hydrated}
                        className="rounded border-white/20 bg-black/40 text-rf-red focus:ring-red-500/40 h-4 w-4 shrink-0"
                        aria-label="Hide completed trials in this list"
                    />
                    <label htmlFor="trials-hide-completed" className="text-xs text-white/50 cursor-pointer select-none">
                        Hide completed
                    </label>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-black/25 px-6 py-10 text-center">
                    <p className="text-sm text-white/55 mb-2">No trials match these filters.</p>
                    {hideCompleted && hydrated ? (
                        <p className="text-xs text-white/40 mb-3">Uncheck &quot;Hide completed&quot; to show trials you already finished.</p>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => {
                            setBranch('all')
                            setDifficulty('all')
                            setTag('all')
                            setHideCompleted(false)
                        }}
                        className="text-xs font-semibold text-rf-red/90"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <ul className="space-y-4 list-none p-0 m-0">
                    {filtered.map((t) => (
                        <li key={t.id}>
                            <TrialSummaryCard trial={t} liveHint={liveHints[t.id] ?? null} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
