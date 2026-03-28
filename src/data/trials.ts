/**
 * Weekly Trials briefing — editorial / curated content for RaiderForge.
 *
 * MetaForge does not currently expose a dedicated Trials API in our integration.
 * This module holds a typed, rotatable local catalog with scoring tips and map links.
 * When/if MetaForge adds Trials data, map API rows → `WeeklyTrial` in a server loader.
 */

import type { MapCoverRfId } from '@/lib/maps/mapCovers'

export type TrialBranch = 'conditioning' | 'mobility' | 'survival'

export type WeeklyTrial = {
    id: string
    name: string
    branch: TrialBranch
    /**
     * RaiderForge map route id for thumbnails and /maps/[mapId] links.
     * `null` when the trial is not tied to a single zone (e.g. generic tips).
     */
    mapRfId: MapCoverRfId | null
    /** Short label for scoring rules / mutators (our wording, not copied from MetaForge). */
    modifiersSummary: string
    /** What the scoring system tends to reward this week. */
    scoringFocus: string
    /** Concrete steps to chase a high or max score. */
    maxScoreTips: string
    /** Common mistakes that tank score or runs. */
    avoid: string
    /** High-level role / build emphasis (not a full skill tree prescription). */
    roleHint: string
    /** Optional icon from `public/images/trials/` */
    iconSrc?: string
}

export type TrialWeekBundle = {
    /** Stable id for analytics or future API mapping, e.g. `rf-trials-2026-03a` */
    weekId: string
    /** Human label shown in UI */
    label: string
    seasonNote?: string
    trials: WeeklyTrial[]
}

/** Example rotations — extend or replace when live Trials data exists. */
export const TRIAL_WEEK_EXAMPLES: TrialWeekBundle[] = [
    {
        weekId: 'rf-trials-2026-rotation-a',
        label: 'Rotation A — Industrial & desert pressure',
        seasonNote:
            'Example week for UI and strategy layout. Swap entries when you sync with official weekly Trials names.',
        trials: [
            {
                id: 'trial-hornet-havoc',
                name: 'Hornet Havoc',
                branch: 'conditioning',
                mapRfId: 'dam-battlegrounds',
                iconSrc: '/images/trials/damage-hornets.svg',
                modifiersSummary: 'Hornet waves escalate quickly; damage-to-ARC objectives weight heavily.',
                scoringFocus: 'Sustained DPS on swarms, controlled repositioning between cover pieces.',
                maxScoreTips:
                    'Pre-clear sightlines on spillways, save explosives for clumped spawns, and chain staggers so no hornet gets a free volley on your squad.',
                avoid: 'Panicked reloads in the open — one burst down and the multiplier resets hard.',
                roleHint: 'Conditioning / damage roles with mag size or reload perks; one player on crowd control.',
            },
            {
                id: 'trial-carriable-dash',
                name: 'Carriable Relay',
                branch: 'mobility',
                mapRfId: 'spaceport',
                iconSrc: '/images/trials/deliver-carriables.svg',
                modifiersSummary: 'Deliveries must hit checkpoints under a strict route timer.',
                scoringFocus: 'Pathing, slide-jump chains, and zero idle time at handoff zones.',
                maxScoreTips:
                    'Scout the pad-to-pad line in raid daylight once, then run “hot” with only health stops. Drop carriables in cover-adjacent slots to shave exposure.',
                avoid: 'Fighting ARC off-route — kills rarely beat checkpoint bonuses.',
                roleHint: 'Mobility-first kits; one escort with smoke or flash to break line-of-sight.',
            },
            {
                id: 'trial-bombardier-siege',
                name: 'Bombardier Siege',
                branch: 'survival',
                mapRfId: 'burial-city',
                iconSrc: '/images/trials/damage-bombardiers.svg',
                modifiersSummary: 'Artillery ARC punish static holds; survival time + elite kills score.',
                scoringFocus: 'Rotating cover, burst windows, and healing discipline.',
                maxScoreTips:
                    'Never stand on rooftops longer than one magazine. Move diagonally through blocks after each salvo so bombardiers re-target empty space.',
                avoid: 'Stacking as a team — splash wipes the whole multiplier.',
                roleHint: 'Survival / sustain roles; spread vertically instead of huddling.',
            },
        ],
    },
    {
        weekId: 'rf-trials-2026-rotation-b',
        label: 'Rotation B — Peaks and gates',
        seasonNote: 'Second example rotation for variety; structure matches future API fields.',
        trials: [
            {
                id: 'trial-lightning-gauntlet',
                name: 'Lightning Gauntlet',
                branch: 'conditioning',
                mapRfId: 'blue-gate',
                iconSrc: '/images/trials/get-hit-by-lightning.svg',
                modifiersSummary: 'Storm strikes random sectors; staying mobile while dealing damage scores best.',
                scoringFocus: 'Damage during safe windows, minimal time in painted lightning zones.',
                maxScoreTips:
                    'Call lightning paint verbally, hard-pivot wide when ground glows, and use the 1–2s after strike to dump burst damage.',
                avoid: 'Greeding DPS — getting downed clears streak bonuses.',
                roleHint: 'Balanced Conditioning + Mobility; avoid heavy armor that slows exits.',
            },
            {
                id: 'trial-flying-arc-hunt',
                name: 'Flying ARC Hunt',
                branch: 'mobility',
                mapRfId: 'spaceport',
                iconSrc: '/images/trials/damage-flying-arc-spaceport.svg',
                modifiersSummary: 'Aerial targets only count for primary score; ground ARC are distractions.',
                scoringFocus: 'Vertical tracking, leading shots, and fast elevation changes.',
                maxScoreTips:
                    'Stage on gantries and launch towers, pre-aim travel lanes, and swap to precision weapons when drones hover for scans.',
                avoid: 'Dumping ammo into grounded ARC — empty mags when flyers appear.',
                roleHint: 'Mobility + accurate mid-range; coordinate who calls targets.',
            },
            {
                id: 'trial-frostline',
                name: 'Frostline Endurance',
                branch: 'survival',
                mapRfId: 'stella-montis',
                modifiersSummary: 'Cold tick + patrol waves; longest stable survival wins.',
                scoringFocus: 'Warmth routes, indoor resets, and controlled pulls.',
                maxScoreTips:
                    'Plan a loop through heated interiors, never double-back into wind tunnels, and pull ARC one pack at a time to avoid crossfire.',
                avoid: 'Long outdoor fights — exposure stacks faster than heals.',
                roleHint: 'Survival sustain and thermal gear; one player dedicated to route calls.',
            },
        ],
    },
]

/** Pick a featured week from the example catalog (deterministic rotation by week number). */
export function getFeaturedTrialWeek(): TrialWeekBundle {
    const w = TRIAL_WEEK_EXAMPLES
    if (w.length === 0) {
        return {
            weekId: 'empty',
            label: 'No trial data',
            trials: [],
        }
    }
    const t = new Date()
    const start = Date.UTC(t.getUTCFullYear(), 0, 1)
    const weekNo = Math.floor((Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - start) / 86400000 / 7)
    return w[weekNo % w.length]!
}

export function getAlternateTrialWeeks(): TrialWeekBundle[] {
    const featured = getFeaturedTrialWeek()
    return TRIAL_WEEK_EXAMPLES.filter((b) => b.weekId !== featured.weekId)
}
