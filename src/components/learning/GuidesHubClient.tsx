'use client'

import { useMemo, useState } from 'react'
import type { GuideArticle } from '@/data/guides'
import { ALL_GUIDE_TAGS } from '@/data/guides'
import type { LearningDifficulty, LearningTag } from '@/data/learningShared'
import { DIFFICULTY_LABEL, LEARNING_TAG_LABEL } from '@/data/learningShared'
import { GuideArticleCard } from '@/components/learning/GuideArticleCard'

type Props = {
    articles: GuideArticle[]
}

const DIFFICULTIES: LearningDifficulty[] = ['onboarding', 'casual', 'advanced']

export function GuidesHubClient({ articles }: Props) {
    const [difficulty, setDifficulty] = useState<LearningDifficulty | 'all'>('all')
    const [tag, setTag] = useState<LearningTag | 'all'>('all')

    const filtered = useMemo(() => {
        return articles.filter((a) => {
            if (difficulty !== 'all' && a.difficulty !== difficulty) return false
            if (tag !== 'all' && !a.tags.includes(tag)) return false
            return true
        })
    }, [articles, difficulty, tag])

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
                                    setTag('all')
                                }}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                    difficulty === d && tag === 'all'
                                        ? 'border-red-500/50 bg-red-500/15 text-white'
                                        : 'border-white/10 bg-black/30 text-white/60 hover:border-white/20 hover:text-white/85'
                                }`}
                            >
                                {DIFFICULTY_LABEL[d]}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                setDifficulty('all')
                                setTag('all')
                            }}
                            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                difficulty === 'all' && tag === 'all'
                                    ? 'border-white/25 bg-white/10 text-white'
                                    : 'border-white/10 bg-black/30 text-white/60 hover:border-white/20'
                            }`}
                            aria-pressed={difficulty === 'all' && tag === 'all'}
                        >
                            All guides
                        </button>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Filter by topic</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setTag('all')}
                            className={`rounded-full border px-3 py-1 text-[11px] font-medium ${
                                tag === 'all'
                                    ? 'border-red-500/45 text-white bg-red-500/10'
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
                                className={`rounded-full border px-3 py-1 text-[11px] font-medium max-w-[200px] truncate ${
                                    tag === t
                                        ? 'border-red-500/45 text-white bg-red-500/10'
                                        : 'border-white/10 text-white/50 hover:text-white/75'
                                }`}
                            >
                                {LEARNING_TAG_LABEL[t]}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-black/25 px-6 py-10 text-center">
                    <p className="text-sm text-white/55 mb-2">No guides match these filters.</p>
                    <button
                        type="button"
                        onClick={() => {
                            setDifficulty('all')
                            setTag('all')
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
