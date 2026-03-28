import type { LearningTag } from '@/data/learningShared'
import { LEARNING_TAG_LABEL } from '@/data/learningShared'

type Props = {
    tags: LearningTag[]
    className?: string
    max?: number
}

export function LearningTagList({ tags, className = '', max = 6 }: Props) {
    const show = tags.slice(0, max)
    const more = tags.length - show.length
    return (
        <ul className={`flex flex-wrap gap-1.5 list-none ${className}`} aria-label="Topics">
            {show.map((tag) => (
                <li
                    key={tag}
                    className="text-[10px] font-medium text-white/50 border border-white/10 rounded px-2 py-0.5 max-w-full truncate"
                    title={LEARNING_TAG_LABEL[tag]}
                >
                    {LEARNING_TAG_LABEL[tag]}
                </li>
            ))}
            {more > 0 ? (
                <li className="text-[10px] text-white/35 self-center">+{more}</li>
            ) : null}
        </ul>
    )
}
