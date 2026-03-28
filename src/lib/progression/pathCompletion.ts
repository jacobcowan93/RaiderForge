import type { LearningPathStep, RecommendedLearningPath } from '@/data/learningPaths'
import { estimatePathMinutes } from '@/data/learningPaths'
import { getGuideBySlug } from '@/data/guides'
import { getTrialById } from '@/data/trials'
import type { LearningProgressPersistedV1 } from '@/lib/progression/localProgressStore'

function stepCompleted(state: LearningProgressPersistedV1, step: LearningPathStep): boolean {
    return step.kind === 'guide'
        ? state.guides[step.slug] === 'completed'
        : state.trials[step.id] === 'completed'
}

function stepMinutes(step: LearningPathStep): number {
    if (step.kind === 'guide') return getGuideBySlug(step.slug)?.estimatedMinutes ?? 0
    return getTrialById(step.id)?.estimatedMinutes ?? 0
}

export function stepsCompletionStats(
    state: LearningProgressPersistedV1,
    steps: LearningPathStep[],
): {
    completed: number
    total: number
    completedFocusMinutes: number
    totalMinutes: number
} {
    let completed = 0
    let completedFocusMinutes = 0
    let totalMinutes = 0
    for (const step of steps) {
        totalMinutes += stepMinutes(step)
        if (stepCompleted(state, step)) {
            completed += 1
            completedFocusMinutes += stepMinutes(step)
        }
    }
    return { completed, total: steps.length, completedFocusMinutes, totalMinutes }
}

export function pathCompletionStats(state: LearningProgressPersistedV1, path: RecommendedLearningPath) {
    const base = stepsCompletionStats(state, path.steps)
    const pathTotal = estimatePathMinutes(path)
    return {
        ...base,
        /** Prefer catalog sum for display consistency with path header */
        totalMinutes: pathTotal > 0 ? pathTotal : base.totalMinutes,
    }
}

/** Featured week + prep guide — for /trials “this week” block. */
export function buildFeaturedWeekProgressSteps(trialIds: string[]): LearningPathStep[] {
    return [{ kind: 'guide', slug: 'weekly-trials-prep' }, ...trialIds.map((id) => ({ kind: 'trial' as const, id }))]
}
