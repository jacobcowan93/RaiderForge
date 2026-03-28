'use client'

import type { LearningItemStatus } from '@/lib/progression/localProgressStore'
import { useLearningProgress } from '@/lib/progression/learningProgressContext'

const STYLE: Record<Exclude<LearningItemStatus, 'not_started'>, string> = {
    in_progress: 'border-amber-500/40 bg-amber-500/15 text-amber-100/90',
    completed: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-100/90',
}

const LABEL: Record<Exclude<LearningItemStatus, 'not_started'>, string> = {
    in_progress: 'Active',
    completed: 'Done',
}

type Props = {
    kind: 'guide' | 'trial'
    id: string
    className?: string
}

export function LearningProgressPill({ kind, id, className = '' }: Props) {
    const { hydrated, getGuideStatus, getTrialStatus } = useLearningProgress()
    if (!hydrated) return null
    const status = kind === 'guide' ? getGuideStatus(id) : getTrialStatus(id)
    if (status === 'not_started') return null
    return (
        <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shrink-0 ${STYLE[status]} ${className}`}
        >
            {LABEL[status]}
        </span>
    )
}

function ariaStatusLabel(s: LearningItemStatus): string {
    if (s === 'not_started') return 'Not started'
    if (s === 'in_progress') return 'In progress'
    return 'Completed'
}

/** Screen-reader label fragment for link names (empty until client hydrated). */
export function useLearningItemAriaStatus(kind: 'guide' | 'trial', id: string): string {
    const { hydrated, getGuideStatus, getTrialStatus } = useLearningProgress()
    if (!hydrated) return ''
    const s = kind === 'guide' ? getGuideStatus(id) : getTrialStatus(id)
    return ariaStatusLabel(s)
}
