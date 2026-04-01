/**
 * MetaForge weekly trials — GET /api/arc-raiders/weekly-trials
 * Yields 5 `is_active` (this week) and 5 `upcoming` (next week) rows when live.
 */

import { getAllTrialsCatalog, getTrialById, type WeeklyTrial } from '@/data/trials'
import type { TrialDifficultyTier } from '@/lib/trials/trialsData'
import { fetchMfWeeklyTrials, type MfWeeklyTrialRow } from '@/api/metaforgeService'
import { getZoneThumbnailUrlOrFallback } from '@/lib/maps/mapCovers'
import {
    TRIAL_COMMAND_BRIEFS,
    buildTrialBriefFromWeekly,
    getNextWeekPresentation,
    getThisWeekPresentation,
    type TrialBrief,
    type TrialWeekPresentation,
} from '@/lib/trials/trialsData'

const GENERIC_TIPS = [
    'Read the in-game objective — partial clears often score worse than one perfect stretch.',
    'Assign one voice for callouts; keep DPS on the scoring condition only.',
    'Check MetaForge map conditions before you lock a route.',
]

const TIER_FROM_DIFF: Record<WeeklyTrial['difficulty'], TrialDifficultyTier> = {
    onboarding: 'Easy',
    casual: 'Medium',
    advanced: 'Hard',
}

function matchLocalTrialId(metaforgeName: string): string | undefined {
    const n = metaforgeName.toLowerCase()

    // ── Enemy-type damage trials ───────────────────────────────────────────────
    if (n.includes('hornet'))                                       return 'trial-hornet-havoc'
    if (n.includes('bombardier'))                                   return 'trial-bombardier-siege'
    if (n.includes('shredder'))                                     return 'trial-damage-shredders'
    if (n.includes('wasp'))                                         return 'trial-damage-wasps'
    if (n.includes('rocketeer'))                                    return 'trial-damage-rocketeers'
    if (n.includes('leaper'))                                       return 'trial-damage-leapers'
    if (n.includes('bastion'))                                      return 'trial-damage-bastions'
    if (n.includes('queen') || n.includes('matriarch'))             return 'trial-damage-queens'
    if (n.includes('spotter'))                                      return 'trial-damage-spotters'
    if (n.includes('snitch'))                                       return 'trial-damage-snitches'
    if (n.includes('tick') || n.includes('fireball') || n.includes(' pop')) return 'trial-destroy-small-arc'
    if (n.includes('flying') && n.includes('arc'))                  return 'trial-damage-flying-arc'
    if (n.includes('ground-based') || n.includes('ground based'))   return 'trial-damage-ground-arc'
    if (/\bdamage any arc\b/.test(n))                               return 'trial-damage-any-arc'
    if (n.includes('swamp'))                                        return 'trial-swamp-arc'

    // ── Condition / event-specific ────────────────────────────────────────────
    if (n.includes('lightning'))                                    return 'trial-lightning-gauntlet'
    if (n.includes('disarm') || (n.includes('mine') && n.includes('locked'))) return 'trial-disarm-mines'
    if (n.includes('download') || (n.includes('bunker') && n.includes('information'))) return 'trial-download-bunker'

    // ── Location-restricted trials ────────────────────────────────────────────
    if (n.includes('west') && n.includes('highway'))                return 'trial-west-highway'
    if ((n.includes('container') || n.includes('open')) && n.includes('tunnel')) return 'trial-traffic-tunnels'
    if (n.includes('medical research'))                             return 'trial-medical-research'

    // ── Collection / search trials ────────────────────────────────────────────
    if (n.includes('carriable') || /\bdeliver\b/i.test(metaforgeName)) return 'trial-carriable-dash'
    if (n.includes('first wave') || (n.includes('search') && n.includes('husk'))) return 'trial-search-husks'
    if (n.includes("bird") && n.includes('nest'))                   return 'trial-loot-bird-nests'
    if (n.includes('raider cache'))                                 return 'trial-raider-caches'
    if (n.includes('supply drop'))                                  return 'trial-supply-drops'
    if (n.includes('harvest') && n.includes('plant'))               return 'trial-harvest-plants'
    if (n.includes('arc probe'))                                    return 'trial-open-probes'

    // ── Survival / endurance ──────────────────────────────────────────────────
    if (n.includes('frost') || n.includes('cold') || n.includes('stella')) return 'trial-frostline'
    if (n.includes('get hit by lightning'))                         return 'trial-get-lightning'

    return undefined
}

function imageForTrial(mf: { image_url?: string }, local?: WeeklyTrial): string {
    const u = mf.image_url?.trim()
    if (u) return u
    if (local?.mapRfId) return getZoneThumbnailUrlOrFallback(local.mapRfId)
    if (local?.iconSrc) return local.iconSrc
    return getZoneThumbnailUrlOrFallback('dam-battlegrounds')
}

function metaforgeRowToBrief(mf: MfWeeklyTrialRow): TrialBrief {
    const localId = matchLocalTrialId(mf.name)
    const local = localId ? getTrialById(localId) : undefined
    const brief = localId ? TRIAL_COMMAND_BRIEFS[localId] : undefined

    const video = mf.video_link && String(mf.video_link).trim()
    const guide = mf.guide_link && String(mf.guide_link).trim()
    const guideUrl =
        video ||
        guide ||
        brief?.guideUrl ||
        `https://www.youtube.com/results?search_query=${encodeURIComponent(`ARC Raiders ${mf.name} trial`)}`
    const guideLabel = video ? 'Video' : guide ? 'Guide' : brief?.guideLabel ?? 'YouTube'

    const tips =
        brief?.tips ??
        (local?.maxScoreTips
            ? local.maxScoreTips
                  .split(/(?<=[.!?])\s+/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .slice(0, 4)
            : GENERIC_TIPS)

    return {
        sourceRowId: typeof mf.id === 'string' ? mf.id : String(mf.id),
        trialId: localId,
        name: mf.name,
        description: brief?.description ?? local?.shortDescription ?? `Weekly objective: ${mf.name}.`,
        maxPoints: brief?.maxPoints ?? 12_000,
        tips: tips.length > 0 ? tips : GENERIC_TIPS,
        imageUrl: imageForTrial(mf, local),
        guideUrl,
        guideLabel,
        difficultyTier: local ? TIER_FROM_DIFF[local.difficulty] : 'Medium',
    }
}

function sortBySortOrder(rows: MfWeeklyTrialRow[]): MfWeeklyTrialRow[] {
    return [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

/** Exactly five cards — trim or pad from catalog rotation. */
function ensureFiveTrials(briefs: TrialBrief[]): TrialBrief[] {
    const out = briefs.slice(0, 5)
    const c = getAllTrialsCatalog()
    let i = 0
    while (out.length < 5 && c.length > 0) {
        out.push(buildTrialBriefFromWeekly(c[i % c.length]!))
        i++
    }
    return out.slice(0, 5)
}

/** Primary: MetaForge weekly-trials. Fallback: `getThisWeekPresentation` / `getNextWeekPresentation` (capped at 5). */
export async function getWeeklyTrialsForPage(now: Date = new Date()): Promise<{
    thisWeek: TrialWeekPresentation
    nextWeek: TrialWeekPresentation
    source: 'metaforge' | 'fallback'
    activeWindowEnd: string | null
    nextWindowStart: string | null
    /** Temporary: MetaForge “current week” window vs API status (remove when stable). */
    metaforgeDebugLine: string
}> {
    const mf = await fetchMfWeeklyTrials()

    if (mf.ok && mf.data.length > 0) {
        const active = sortBySortOrder(mf.data.filter((t) => t.is_active)).slice(0, 5)
        const upcoming = sortBySortOrder(mf.data.filter((t) => t.upcoming)).slice(0, 5)

        // MetaForge's `upcoming` flag tracks the actual current live rotation;
        // `is_active` lags by one week. Show upcoming as "this week" and omit
        // the stale active set entirely (nextWeek is left as a fallback shell).
        if (upcoming.length > 0) {
            const fmt = (iso: string | null) =>
                iso
                    ? new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }) +
                      ' UTC'
                    : null

            const dbgFmt = (iso: string | null) =>
                iso ? new Date(iso).toISOString().replace(/\.\d{3}Z$/, 'Z') : '—'
            return {
                source: 'metaforge',
                activeWindowEnd: mf.nextWindowStart,   // next start = when current ends
                nextWindowStart: null,
                metaforgeDebugLine: `[Debug] MetaForge weekly-trials: source=live (upcoming-as-current) | rotation_end_utc=${dbgFmt(mf.nextWindowStart)} | this_section_rows=${upcoming.length}`,
                thisWeek: {
                    weekKey: 'metaforge-this',
                    label: mf.nextWindowStart
                        ? `This rotation (resets ${fmt(mf.nextWindowStart)})`
                        : "This week's Trials (MetaForge)",
                    subtitle: undefined,
                    trials: upcoming.map(metaforgeRowToBrief),
                },
                // nextWeek is intentionally empty — the page no longer renders it
                nextWeek: {
                    weekKey: 'metaforge-next',
                    label: '',
                    subtitle: undefined,
                    trials: [],
                },
            }
        }
    }

    const thisP = getThisWeekPresentation(now)
    const nextP = getNextWeekPresentation(now)

    return {
        source: 'fallback',
        activeWindowEnd: null,
        nextWindowStart: null,
        metaforgeDebugLine:
            '[Debug] MetaForge weekly-trials: source=fallback (API missing or not 5+5 rows) · using getThisWeekPresentation / getNextWeekPresentation · rows capped/padded to 5 each',
        thisWeek: {
            ...thisP,
            subtitle:
                thisP.subtitle ??
                'Live schedule unavailable — showing the local rotation preview (five trials) until MetaForge responds.',
            trials: ensureFiveTrials(thisP.trials),
        },
        nextWeek: {
            ...nextP,
            trials: ensureFiveTrials(nextP.trials),
        },
    }
}
