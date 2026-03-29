/**
 * Weekly Trials — command-center copy (max points, tips, guide links).
 * Merged with `src/data/trials.ts` rotations so “this week” matches the featured catalog.
 */

import type { LearningDifficulty } from '@/data/learningShared'
import type { TrialWeekBundle, WeeklyTrial } from '@/data/trials'
import { getFeaturedTrialWeek } from '@/data/trials'
import { getZoneThumbnailUrlOrFallback } from '@/lib/maps/mapCovers'

/** Player-facing tier for cards (maps catalog onboarding → Easy, casual → Medium, advanced → Hard). */
export type TrialDifficultyTier = 'Easy' | 'Medium' | 'Hard'

const DIFFICULTY_TO_TIER: Record<LearningDifficulty, TrialDifficultyTier> = {
    onboarding: 'Easy',
    casual: 'Medium',
    advanced: 'Hard',
}

export type TrialBrief = {
    trialId?: string
    name: string
    description: string
    maxPoints: number
    tips: string[]
    /** Thematic card art under `/public/images/trials/` (SVG now; swap to same-basename `.jpg` later if desired). */
    imageUrl: string
    guideUrl?: string
    guideLabel?: string
    difficultyTier: TrialDifficultyTier
}

export type TrialWeekPresentation = {
    weekKey: string
    label: string
    subtitle?: string
    trials: TrialBrief[]
}

/** Extra fields keyed by `WeeklyTrial.id` — merged onto catalog trials for the tactical cards. */
export const TRIAL_COMMAND_BRIEFS: Record<
    string,
    {
        maxPoints: number
        tips: string[]
        imageUrl: string
        guideUrl?: string
        guideLabel?: string
        /** Overrides card description when set; else `WeeklyTrial.shortDescription` */
        description?: string
    }
> = {
    'trial-hornet-havoc': {
        maxPoints: 15_000,
        imageUrl: '/images/trials/hornet-havoc.svg',
        tips: [
            'Loadout: mag size + reload perks (Conditioning); bring one stagger tool (grenade/shotgun) so swarms never reset your chain.',
            'Position: hold elevated spillways with a rear exit — never dead-end in a pipe when the wave thickens.',
            'Pre-spawn: clear sightlines before the hornet icon ticks; the first 5s set your multiplier ceiling.',
            'Roles: one fixed “crowd” player kites low HP stragglers; DPS tunnel the main pack so staggers overlap.',
        ],
        guideUrl:
            'https://www.youtube.com/results?search_query=ARC+Raiders+trials+hornet+swarm+damage&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },
    'trial-carriable-dash': {
        maxPoints: 12_500,
        imageUrl: '/images/trials/carriable-relay.svg',
        tips: [
            'Loadout: Mobility + stamina; light armor — weight saves seconds on every pad. Skip “raid” DPS unless you’re on escort duty.',
            'Route: one dry run in daylight to map pad order, then run “hot” with only scripted heal stops.',
            'Handoffs: drop carriables in cover-adjacent slots; never open-field swaps — one pick-up animation costs a checkpoint.',
            'Escort: smoke/flash for line-of-sight breaks, not kills — fighting off-route rarely beats checkpoint score.',
        ],
        guideUrl: '/guides',
        guideLabel: 'Prep guides',
    },
    'trial-bombardier-siege': {
        maxPoints: 18_000,
        imageUrl: '/images/trials/bombardier-siege.svg',
        tips: [
            'Loadout: sustain + splash resist (Survival); avoid glass cannons — one downed player tanks the whole squad multiplier.',
            'Position: diagonal rotations between blocks after each salvo; never stand on rooftops longer than one magazine.',
            'Spacing: spread vertically (different floors) so splash can’t hit two — stacking is a wipe.',
            'Healing: bank heals for post-salvo spikes; don’t waste kits on chip damage between patterns.',
        ],
        guideUrl:
            'https://www.youtube.com/results?search_query=ARC+Raiders+trials+bombardier+artillery+siege&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },
    'trial-lightning-gauntlet': {
        maxPoints: 16_500,
        imageUrl: '/images/trials/lightning-gauntlet.svg',
        tips: [
            'Loadout: Mobility + burst Conditioning — dump damage only in the 1–2s after a strike, not while paint is active.',
            'Callouts: one voice calls “paint” / “clear” so everyone pivots on the same frame.',
            'Movement: wide arcs when ground glows; never greed DPS through a painted tile — streak resets cost more than one missed burst.',
            'Armor: avoid heavy slows that trap you in strike sectors; speed > raw mitigation here.',
        ],
        guideUrl:
            'https://www.youtube.com/results?search_query=ARC+Raiders+trials+lightning+storm+gauntlet&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },
    'trial-flying-arc-hunt': {
        maxPoints: 14_000,
        imageUrl: '/images/trials/flying-arc-hunt.svg',
        tips: [
            'Loadout: mid-range precision + spare ammo box — flyers are the score; ground ARC are distraction tax.',
            'Position: gantries and towers with pre-aimed travel lanes; lead shots when drones commit to a hover “scan” window.',
            'Ammo discipline: reserve a full mag for flyer waves; dumping into grounded ARC = empty flyers.',
            'Comms: call targets by clock; one primary caller prevents double-focus and missed flyers.',
        ],
        guideUrl:
            'https://www.youtube.com/results?search_query=ARC+Raiders+trials+flying+arc+drones&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },
    'trial-frostline': {
        maxPoints: 17_500,
        imageUrl: '/images/trials/frostline-endurance.svg',
        tips: [
            'Loadout: thermal sustain + pull discipline (Survival); melee/rush builds lose time to exposure and patrol adds.',
            'Route: indoor loop through heated interiors; never double-back into wind tunnels.',
            'Pulls: one pack at a time — crossfire in the cold burns more meds than the kill is worth.',
            'Roles: one dedicated route caller; others only shoot on-calls to avoid accidental multi-pulls.',
        ],
        guideUrl:
            'https://www.youtube.com/results?search_query=ARC+Raiders+trials+stella+cold+frost&sp=EgIQAQ%253D%253D',
        guideLabel: 'YouTube',
    },
}

export const TRIALS_PAGE_MATURITY = 'live' as const

function trialToBrief(t: WeeklyTrial): TrialBrief {
    const extra = TRIAL_COMMAND_BRIEFS[t.id]
    const tips =
        extra?.tips ??
        t.maxScoreTips
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 4)
    return {
        trialId: t.id,
        name: t.name,
        description: extra?.description ?? t.shortDescription,
        maxPoints: extra?.maxPoints ?? 12_000,
        tips: tips.length > 0 ? tips : ['See full briefing for scoring focus.'],
        imageUrl: extra?.imageUrl ?? (t.mapRfId ? getZoneThumbnailUrlOrFallback(t.mapRfId) : getZoneThumbnailUrlOrFallback('dam-battlegrounds')),
        guideUrl: extra?.guideUrl,
        guideLabel: extra?.guideLabel,
        difficultyTier: DIFFICULTY_TO_TIER[t.difficulty],
    }
}

export function mergeWeekBundle(bundle: TrialWeekBundle): TrialWeekPresentation {
    return {
        weekKey: bundle.weekId,
        label: bundle.label,
        subtitle: bundle.seasonNote,
        trials: bundle.trials.map(trialToBrief),
    }
}

export function getThisWeekPresentation(now: Date = new Date()): TrialWeekPresentation {
    return mergeWeekBundle(getFeaturedTrialWeek(now))
}

/** Next calendar week (UTC), same indexing as `getFeaturedTrialWeek`. */
export function getNextWeekPresentation(now: Date = new Date()): TrialWeekPresentation {
    return mergeWeekBundle(getFeaturedTrialWeek(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)))
}
