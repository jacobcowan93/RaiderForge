/**
 * Shared metadata for Guides / Trials surfaces (local catalog only).
 * Not used by Skill Tree.
 */

export type LearningDifficulty = 'onboarding' | 'casual' | 'advanced'

export type LearningKind = 'trial' | 'guide' | 'tutorial' | 'reference'

/** High-level topics for filtering and scanability. */
export type LearningTag =
    | 'movement'
    | 'loot'
    | 'boss'
    | 'build'
    | 'maps'
    | 'trials'
    | 'economy'
    | 'teamplay'
    | 'conditions'
    | 'reference'

export const LEARNING_TAG_LABEL: Record<LearningTag, string> = {
    movement: 'Movement',
    loot: 'Loot',
    boss: 'Boss / elites',
    build: 'Build / roles',
    maps: 'Maps',
    trials: 'Trials',
    economy: 'Economy',
    teamplay: 'Teamplay',
    conditions: 'Live conditions',
    reference: 'Reference',
}

export const DIFFICULTY_LABEL: Record<LearningDifficulty, string> = {
    onboarding: 'Getting started',
    casual: 'Intermediate',
    advanced: 'Advanced',
}

export const DIFFICULTY_SHORT: Record<LearningDifficulty, string> = {
    onboarding: 'Start',
    casual: 'Mid',
    advanced: 'Adv',
}

export type EstimatedTimeKind = 'read' | 'focus'

export function formatEstimatedTime(minutes: number, kind: EstimatedTimeKind = 'read'): string {
    const suffix = kind === 'read' ? ' read' : ' focus'
    if (minutes < 60) return `${minutes} min${suffix}`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m ? `${h}h ${m}m${suffix}` : `${h}h${suffix}`
}
