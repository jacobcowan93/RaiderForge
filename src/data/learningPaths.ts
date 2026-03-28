/**
 * Recommended learning tracks (guides + trials). Used by hubs and weekly summary.
 *
 * Warmup path: `getWeeklyWarmupPath()` uses `getFeaturedTrialWeek()` so recommended steps match
 * the same rotation as /trials “This week’s” block (no progression schema change).
 */

import type { LearningDifficulty } from '@/data/learningShared'
import { getGuideBySlug } from '@/data/guides'
import { getFeaturedTrialWeek, getTrialById } from '@/data/trials'

export type LearningPathStep = { kind: 'guide'; slug: string } | { kind: 'trial'; id: string }

export type RecommendedLearningPath = {
    id: string
    title: string
    blurb: string
    difficultyBand: LearningDifficulty
    steps: LearningPathStep[]
}

/** Static paths (onboarding). Weekly warmup is built from `getFeaturedTrialWeek()` so it tracks the live rotation. */
export const ONBOARDING_LEARNING_PATH: RecommendedLearningPath = {
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
}

export const RECOMMENDED_LEARNING_PATHS: RecommendedLearningPath[] = [ONBOARDING_LEARNING_PATH]

/** Matches the same featured week as /trials “This week’s” block. */
export function getWeeklyWarmupPath(): RecommendedLearningPath {
    const featured = getFeaturedTrialWeek()
    const trialSteps = featured.trials.map((t) => ({ kind: 'trial' as const, id: t.id }))
    return {
        id: 'weekly-warmup',
        title: 'Weekly playlist warmup',
        blurb: `Prep brief, then this week’s rotation: ${featured.label}.`,
        difficultyBand: 'casual',
        steps: [{ kind: 'guide', slug: 'weekly-trials-prep' }, ...trialSteps],
    }
}

/** Paths shown in hubs: onboarding + current week’s warmup. */
export function getHubRecommendedPaths(): RecommendedLearningPath[] {
    return [ONBOARDING_LEARNING_PATH, getWeeklyWarmupPath()]
}

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
    if (id === 'weekly-warmup') return getWeeklyWarmupPath()
    return RECOMMENDED_LEARNING_PATHS.find((p) => p.id === id)
}
