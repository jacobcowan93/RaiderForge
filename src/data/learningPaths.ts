/**
 * Recommended learning tracks (guides + trials). Used by hubs and weekly summary.
 */

import type { LearningDifficulty } from '@/data/learningShared'
import { getGuideBySlug } from '@/data/guides'
import { getTrialById } from '@/data/trials'

export type LearningPathStep = { kind: 'guide'; slug: string } | { kind: 'trial'; id: string }

export type RecommendedLearningPath = {
    id: string
    title: string
    blurb: string
    difficultyBand: LearningDifficulty
    steps: LearningPathStep[]
}

export const RECOMMENDED_LEARNING_PATHS: RecommendedLearningPath[] = [
    {
        id: 'onboarding-arc',
        title: 'Onboarding to ARC Raiders',
        blurb: 'Maps desk, squad roles, a forgiving trial, Trials prep, then a second run.',
        difficultyBand: 'onboarding',
        steps: [
            { kind: 'guide', slug: 'maps-command-center' },
            { kind: 'guide', slug: 'roles-at-a-glance' },
            { kind: 'trial', id: 'trial-carriable-dash' },
            { kind: 'guide', slug: 'weekly-trials-prep' },
            { kind: 'trial', id: 'trial-flying-arc-hunt' },
        ],
    },
    {
        id: 'weekly-warmup',
        title: 'Weekly playlist warmup',
        blurb: 'Prep brief first, then drill three rotation-A trials in order (swap mentally if your featured week differs).',
        difficultyBand: 'casual',
        steps: [
            { kind: 'guide', slug: 'weekly-trials-prep' },
            { kind: 'trial', id: 'trial-hornet-havoc' },
            { kind: 'trial', id: 'trial-carriable-dash' },
            { kind: 'trial', id: 'trial-bombardier-siege' },
        ],
    },
]

export function estimatePathMinutes(path: RecommendedLearningPath): number {
    let m = 0
    for (const step of path.steps) {
        if (step.kind === 'guide') {
            const g = getGuideBySlug(step.slug)
            if (g) m += g.estimatedMinutes
        } else {
            const t = getTrialById(step.id)
            if (t) m += t.estimatedMinutes
        }
    }
    return m
}

export function getPathStepHref(step: LearningPathStep): string {
    return step.kind === 'guide' ? `/guides/${step.slug}` : `/trials/${step.id}`
}

export function getPathStepLabel(step: LearningPathStep): string {
    if (step.kind === 'guide') {
        return getGuideBySlug(step.slug)?.title ?? step.slug
    }
    return getTrialById(step.id)?.name ?? step.id
}

export function getRecommendedPathById(id: string): RecommendedLearningPath | undefined {
    return RECOMMENDED_LEARNING_PATHS.find((p) => p.id === id)
}
