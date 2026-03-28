'use client'

import Link from 'next/link'
import type { GuideArticle } from '@/data/guides'
import { formatEstimatedTime } from '@/data/learningShared'
import { LearningDifficultyBadge } from '@/components/learning/LearningDifficultyBadge'
import { LearningProgressPill, useLearningItemAriaStatus } from '@/components/learning/LearningProgressPill'
import { LearningTagList } from '@/components/learning/LearningTagList'

type Props = { article: GuideArticle }

export function GuideArticleCard({ article }: Props) {
    const ariaProgress = useLearningItemAriaStatus('guide', article.slug)
    return (
        <Link
            href={`/guides/${article.slug}`}
            aria-label={ariaProgress ? `${article.title}. Progress: ${ariaProgress}.` : article.title}
            className="group relative block rounded-xl border border-white/[0.08] bg-black/40 hover:border-red-500/35 hover:bg-black/55 p-4 sm:p-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/45 min-w-0"
        >
            <div className="absolute top-3 right-3 z-10 pointer-events-none">
                <LearningProgressPill kind="guide" id={article.slug} />
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2 pr-14">
                <LearningDifficultyBadge difficulty={article.difficulty} compact />
                <span className="text-[10px] uppercase tracking-wider text-white/35 font-semibold">{article.kind}</span>
                <span className="text-[10px] text-white/30 tabular-nums ml-auto">{formatEstimatedTime(article.estimatedMinutes)}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-white mb-2 leading-snug break-words">
                {article.title}
            </h3>
            <p className="text-sm text-white/55 leading-relaxed line-clamp-3 mb-3">{article.description}</p>
            <LearningTagList tags={article.tags} />
        </Link>
    )
}
