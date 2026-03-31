'use client'

import { useMemo, useState } from 'react'
import type { GuideArticle } from '@/data/guides'
import { ALL_GUIDE_TAGS } from '@/data/guides'
import type { LearningDifficulty, LearningTag } from '@/data/learningShared'
import { DIFFICULTY_LABEL, LEARNING_TAG_LABEL } from '@/data/learningShared'
import { GuideArticleCard } from '@/components/learning/GuideArticleCard'
import { useLearningProgress } from '@/lib/progression/learningProgressContext'

type Props = {
    articles: GuideArticle[]
}

const DIFFICULTIES: LearningDifficulty[] = ['onboarding', 'casual', 'advanced']

export function GuidesHubClient({ articles }: Props) {
    const { hydrated, getGuideStatus } = useLearningProgress()
    const [query, setQuery] = useState('')
    const [difficulty, setDifficulty] = useState<LearningDifficulty | 'all'>('all')
    const [tag, setTag] = useState<LearningTag | 'all'>('all')
    const [hideCompleted, setHideCompleted] = useState(false)

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return articles.filter((a) => {
            if (
                q &&
                !`${a.title} ${a.description} ${a.tags.join(' ')} ${a.kind}`.toLowerCase().includes(q)
            ) {
                return false
            }
            if (difficulty !== 'all' && a.difficulty !== difficulty) return false
            if (tag !== 'all' && !a.tags.includes(tag)) return false
            if (hydrated && hideCompleted && getGuideStatus(a.slug) === 'completed') return false
            return true
        })
    }, [articles, difficulty, getGuideStatus, hideCompleted, hydrated, query, tag])

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-black/35 p-4 sm:p-5">
                <div className="flex flex-col gap-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                        <div>
                            <label
                                htmlFor="guides-search"
                                className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40"
                            >
                                Search briefings
                            </label>
                            <div className="relative">
                                <svg
                                    viewBox="0 0 16 16"
                                    width="14"
                                    height="14"
                                    fill="currentColor"
                                    aria-hidden
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                                >
                                    <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z" />
                                </svg>
                                <input
                                    id="guides-search"
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search maps, trials, loot, roles, conditions…"
                                    className="w-full rounded-xl border border-white/10 bg-black/35 py-3 pl-9 pr-3 text-sm text-white placeholder:text-white/28 outline-none transition-colors focus:border-red-500/35 focus:ring-2 focus:ring-red-500/15"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Visible</p>
                                <p className="mt-1 text-2xl font-black tabular-nums text-white">{filtered.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Library</p>
                                <p className="mt-1 text-2xl font-black tabular-nums text-white/85">{articles.length}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">Topics</p>
                                <p className="mt-1 text-2xl font-black tabular-nums text-white/85">{ALL_GUIDE_TAGS.length}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Start with your pace</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setDifficulty('all')
                                    setTag('all')
                                }}
                                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                                    difficulty === 'all' && tag === 'all'
                                        ? 'border-white/20 bg-white/[0.08] text-white'
                                        : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:text-white/85'
                                }`}
                                aria-pressed={difficulty === 'all' && tag === 'all'}
                            >
                                All briefings
                            </button>
                            {DIFFICULTIES.map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => {
                                        setDifficulty(d)
                                        setTag('all')
                                    }}
                                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                                        difficulty === d && tag === 'all'
                                            ? 'border-red-500/45 bg-red-500/12 text-white'
                                            : 'border-white/10 bg-black/20 text-white/60 hover:border-white/20 hover:text-white/85'
                                    }`}
                                >
                                    {DIFFICULTY_LABEL[d]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Filter by topic</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setTag('all')}
                                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                                    tag === 'all'
                                        ? 'border-red-500/45 bg-red-500/10 text-white'
                                        : 'border-white/10 text-white/50 hover:text-white/75'
                                }`}
                            >
                                All topics
                            </button>
                            {ALL_GUIDE_TAGS.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTag(t)}
                                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                                        tag === t
                                            ? 'border-red-500/45 bg-red-500/10 text-white'
                                            : 'border-white/10 text-white/50 hover:text-white/75'
                                    }`}
                                >
                                    {LEARNING_TAG_LABEL[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                        <div className="flex items-center gap-2">
                            <input
                                id="guides-hide-completed"
                                type="checkbox"
                                checked={hideCompleted}
                                onChange={(e) => setHideCompleted(e.target.checked)}
                                disabled={!hydrated}
                                className="h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-rf-red focus:ring-red-500/40"
                                aria-label="Hide completed guides in this list"
                            />
                            <label htmlFor="guides-hide-completed" className="cursor-pointer select-none text-xs text-white/50">
                                Hide completed
                            </label>
                        </div>
                        {(query || difficulty !== 'all' || tag !== 'all' || hideCompleted) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setQuery('')
                                    setDifficulty('all')
                                    setTag('all')
                                    setHideCompleted(false)
                                }}
                                className="text-xs font-semibold text-rf-red/90 hover:text-rf-red"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-black/25 px-6 py-10 text-center">
                    <p className="text-sm text-white/55 mb-2">No guides match these filters.</p>
                    {hideCompleted && hydrated ? (
                        <p className="text-xs text-white/40 mb-3">Uncheck &quot;Hide completed&quot; to show guides you already finished.</p>
                    ) : null}
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('')
                            setDifficulty('all')
                            setTag('all')
                            setHideCompleted(false)
                        }}
                        className="text-xs font-semibold text-rf-red/90 hover:text-rf-red"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
                    {filtered.map((a) => (
                        <li key={a.slug}>
                            <GuideArticleCard article={a} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
