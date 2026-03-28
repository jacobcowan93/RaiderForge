import type { LearningDifficulty } from '@/data/learningShared'
import { DIFFICULTY_LABEL, DIFFICULTY_SHORT } from '@/data/learningShared'

const STYLE: Record<LearningDifficulty, string> = {
    onboarding: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100/90',
    casual: 'border-amber-500/35 bg-amber-500/10 text-amber-100/90',
    advanced: 'border-red-500/40 bg-red-500/10 text-red-100/90',
}

type Props = {
    difficulty: LearningDifficulty
    compact?: boolean
    className?: string
}

export function LearningDifficultyBadge({ difficulty, compact, className = '' }: Props) {
    return (
        <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap shrink-0 ${STYLE[difficulty]} ${className}`}
        >
            {compact ? DIFFICULTY_SHORT[difficulty] : DIFFICULTY_LABEL[difficulty]}
        </span>
    )
}
