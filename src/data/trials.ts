/**
 * Weekly Trials — local typed catalog (playlist + detail routes).
 * Swap for API rows when MetaForge exposes Trials.
 */

import type { LearningDifficulty, LearningTag } from '@/data/learningShared'
import type { MapCoverRfId } from '@/lib/maps/mapCovers'
import { getUtcMondayMidnightOfCurrentWeekMs } from '@/lib/trials/weeklyReset'

export type TrialBranch = 'conditioning' | 'mobility' | 'survival'

export type TrialProgressChecklistItem = { id: string; label: string }

export type WeeklyTrial = {
    id: string
    name: string
    /** Card / list one-liner */
    shortDescription: string
    branch: TrialBranch
    difficulty: LearningDifficulty
    /** Rough prep + run focus time for scanning */
    estimatedMinutes: number
    tags: LearningTag[]
    mapRfId: MapCoverRfId | null
    modifiersSummary: string
    scoringFocus: string
    maxScoreTips: string
    avoid: string
    roleHint: string
    iconSrc?: string
    /** Local checklist keys for progression UI */
    progressChecklist?: TrialProgressChecklistItem[]
}

export type TrialWeekBundle = {
    weekId: string
    label: string
    seasonNote?: string
    trials: WeeklyTrial[]
}

const T_HORNET: WeeklyTrial = {
    id: 'trial-hornet-havoc',
    name: 'Hornet Havoc',
    shortDescription: 'Swarm DPS checks on industrial ground — chain staggers and control reload rhythm.',
    branch: 'conditioning',
    difficulty: 'casual',
    estimatedMinutes: 12,
    tags: ['boss', 'build', 'trials', 'maps'],
    mapRfId: 'dam-battlegrounds',
    iconSrc: '/images/trials/damage-hornets.svg',
    modifiersSummary: 'Hornet waves escalate quickly; damage-to-ARC objectives weight heavily.',
    scoringFocus: 'Sustained DPS on swarms, controlled repositioning between cover pieces.',
    maxScoreTips:
        'Pre-clear sightlines on spillways, save explosives for clumped spawns, and chain staggers so no hornet gets a free volley on your squad.',
    avoid: 'Panicked reloads in the open — one burst down and the multiplier resets hard.',
    roleHint: 'Conditioning / damage roles with mag size or reload perks; one player on crowd control.',
    progressChecklist: [
        { id: 'modifiers', label: 'Modifiers understood' },
        { id: 'route', label: 'Route / sightlines planned' },
        { id: 'roles', label: 'Roles practiced in squad' },
    ],
}

const T_CARRIABLE: WeeklyTrial = {
    id: 'trial-carriable-dash',
    name: 'Carriable Relay',
    shortDescription: 'Checkpoint deliveries under time — route discipline beats fighting everything.',
    branch: 'mobility',
    difficulty: 'onboarding',
    estimatedMinutes: 8,
    tags: ['movement', 'trials', 'maps', 'teamplay'],
    mapRfId: 'spaceport',
    iconSrc: '/images/trials/deliver-carriables.svg',
    modifiersSummary: 'Deliveries must hit checkpoints under a strict route timer.',
    scoringFocus: 'Pathing, slide-jump chains, and zero idle time at handoff zones.',
    maxScoreTips:
        'Scout the pad-to-pad line in raid daylight once, then run “hot” with only health stops. Drop carriables in cover-adjacent slots to shave exposure.',
    avoid: 'Fighting ARC off-route — kills rarely beat checkpoint bonuses.',
    roleHint: 'Mobility-first kits; one escort with smoke or flash to break line-of-sight.',
    progressChecklist: [
        { id: 'modifiers', label: 'Checkpoint timing clear' },
        { id: 'route', label: 'Handoff path scouted' },
        { id: 'roles', label: 'Escort + carrier assigned' },
    ],
}

const T_BOMB: WeeklyTrial = {
    id: 'trial-bombardier-siege',
    name: 'Bombardier Siege',
    shortDescription: 'Artillery patterns punish static holds — rotate cover and spread vertically.',
    branch: 'survival',
    difficulty: 'advanced',
    estimatedMinutes: 15,
    tags: ['boss', 'movement', 'trials', 'maps'],
    mapRfId: 'burial-city',
    iconSrc: '/images/trials/damage-bombardiers.svg',
    modifiersSummary: 'Artillery ARC punish static holds; survival time + elite kills score.',
    scoringFocus: 'Rotating cover, burst windows, and healing discipline.',
    maxScoreTips:
        'Never stand on rooftops longer than one magazine. Move diagonally through blocks after each salvo so bombardiers re-target empty space.',
    avoid: 'Stacking as a team — splash wipes the whole multiplier.',
    roleHint: 'Survival / sustain roles; spread vertically instead of huddling.',
    progressChecklist: [
        { id: 'modifiers', label: 'Artillery cadence internalized' },
        { id: 'route', label: 'Rotation cover mapped' },
        { id: 'roles', label: 'Spread / heals rehearsed' },
    ],
}

const T_LIGHT: WeeklyTrial = {
    id: 'trial-lightning-gauntlet',
    name: 'Lightning Gauntlet',
    shortDescription: 'Strike windows and painted floors — damage only when the storm allows.',
    branch: 'conditioning',
    difficulty: 'advanced',
    estimatedMinutes: 14,
    tags: ['conditions', 'movement', 'trials', 'maps'],
    mapRfId: 'blue-gate',
    iconSrc: '/images/trials/get-hit-by-lightning.svg',
    modifiersSummary: 'Storm strikes random sectors; staying mobile while dealing damage scores best.',
    scoringFocus: 'Damage during safe windows, minimal time in painted lightning zones.',
    maxScoreTips:
        'Call lightning paint verbally, hard-pivot wide when ground glows, and use the 1–2s after strike to dump burst damage.',
    avoid: 'Greeding DPS — getting downed clears streak bonuses.',
    roleHint: 'Balanced Conditioning + Mobility; avoid heavy armor that slows exits.',
    progressChecklist: [
        { id: 'modifiers', label: 'Lightning windows called' },
        { id: 'route', label: 'Safe exits identified' },
        { id: 'roles', label: 'Burst / move roles set' },
    ],
}

const T_FLY: WeeklyTrial = {
    id: 'trial-flying-arc-hunt',
    name: 'Flying ARC Hunt',
    shortDescription: 'Aerial targets drive the score — save ammo and elevation for flyers.',
    branch: 'mobility',
    difficulty: 'casual',
    estimatedMinutes: 11,
    tags: ['movement', 'boss', 'trials', 'maps'],
    mapRfId: 'spaceport',
    iconSrc: '/images/trials/damage-flying-arc-spaceport.svg',
    modifiersSummary: 'Aerial targets only count for primary score; ground ARC are distractions.',
    scoringFocus: 'Vertical tracking, leading shots, and fast elevation changes.',
    maxScoreTips:
        'Stage on gantries and launch towers, pre-aim travel lanes, and swap to precision weapons when drones hover for scans.',
    avoid: 'Dumping ammo into grounded ARC — empty mags when flyers appear.',
    roleHint: 'Mobility + accurate mid-range; coordinate who calls targets.',
    progressChecklist: [
        { id: 'modifiers', label: 'Flyer-only scoring rule clear' },
        { id: 'route', label: 'Elevation / lanes chosen' },
        { id: 'roles', label: 'Callouts for air targets' },
    ],
}

const T_FROST: WeeklyTrial = {
    id: 'trial-frostline',
    name: 'Frostline Endurance',
    shortDescription: 'Cold exposure + patrol cadence — indoor loops and single pulls win time.',
    branch: 'survival',
    difficulty: 'advanced',
    estimatedMinutes: 16,
    tags: ['movement', 'teamplay', 'trials', 'maps'],
    mapRfId: 'stella-montis',
    modifiersSummary: 'Cold tick + patrol waves; longest stable survival wins.',
    scoringFocus: 'Warmth routes, indoor resets, and controlled pulls.',
    maxScoreTips:
        'Plan a loop through heated interiors, never double-back into wind tunnels, and pull ARC one pack at a time to avoid crossfire.',
    avoid: 'Long outdoor fights — exposure stacks faster than heals.',
    roleHint: 'Survival sustain and thermal gear; one player dedicated to route calls.',
    progressChecklist: [
        { id: 'modifiers', label: 'Cold / patrol cadence noted' },
        { id: 'route', label: 'Warm loop practiced' },
        { id: 'roles', label: 'Pull discipline agreed' },
    ],
}

export const TRIAL_WEEK_EXAMPLES: TrialWeekBundle[] = [
    {
        weekId: 'rf-trials-2026-rotation-a',
        label: 'Rotation A — Industrial & desert pressure',
        seasonNote:
            'Example week for UI and strategy layout. Swap entries when you sync with official weekly Trials names.',
        trials: [T_HORNET, T_CARRIABLE, T_BOMB],
    },
    {
        weekId: 'rf-trials-2026-rotation-b',
        label: 'Rotation B — Peaks and gates',
        seasonNote: 'Second example rotation for variety; structure matches future API fields.',
        trials: [T_LIGHT, T_FLY, T_FROST],
    },
]

/**
 * Featured rotation for the UTC calendar week containing `now`.
 * Uses the Monday 00:00 UTC of that week as a stable index (aligned with Trials “week of” display).
 */
export function getFeaturedTrialWeek(now: Date = new Date()): TrialWeekBundle {
    const w = TRIAL_WEEK_EXAMPLES
    if (w.length === 0) {
        return { weekId: 'empty', label: 'No trial data', trials: [] }
    }
    const mondayMs = getUtcMondayMidnightOfCurrentWeekMs(now)
    const weekIndex = Math.floor(mondayMs / (7 * 24 * 60 * 60 * 1000))
    const i = ((weekIndex % w.length) + w.length) % w.length
    return w[i]!
}

export function getAlternateTrialWeeks(): TrialWeekBundle[] {
    const featured = getFeaturedTrialWeek()
    return TRIAL_WEEK_EXAMPLES.filter((b) => b.weekId !== featured.weekId)
}

/** All unique trials for catalog / filters / detail routes. */
export function getAllTrialsCatalog(): WeeklyTrial[] {
    const byId = new Map<string, WeeklyTrial>()
    for (const week of TRIAL_WEEK_EXAMPLES) {
        for (const trial of week.trials) {
            byId.set(trial.id, trial)
        }
    }
    return [...byId.values()]
}

export function getTrialById(id: string): WeeklyTrial | undefined {
    return getAllTrialsCatalog().find((t) => t.id === id)
}

export function getRelatedTrials(currentId: string, limit = 3): WeeklyTrial[] {
    const all = getAllTrialsCatalog().filter((t) => t.id !== currentId)
    const cur = getTrialById(currentId)
    if (!cur) return all.slice(0, limit)
    const scored = all.map((t) => {
        let s = 0
        if (t.branch === cur.branch) s += 2
        if (t.mapRfId && t.mapRfId === cur.mapRfId) s += 2
        for (const tag of t.tags) {
            if (cur.tags.includes(tag)) s += 1
        }
        return { t, s }
    })
    scored.sort((a, b) => b.s - a.s)
    return scored.slice(0, limit).map((x) => x.t)
}
