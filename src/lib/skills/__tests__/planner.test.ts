/**
 * Unit tests for skill tree planner + trial recommendation heuristics.
 * Pure functions only — no React.
 */

import { describe, expect, it } from 'vitest'

import { getTrialById } from '@/data/trials'
import { SKILL_BY_UID } from '@/data/skillTree'
import {
    branchPoints,
    cycleNode,
    decodeBuildFromUrl,
    decodeBuildFromUrlParam,
    encodeBuildToUrl,
    EXPEDITION_POINTS_FULL_MESSAGE,
    getRanks,
    isNodeUnlocked,
    normalizeBuild,
    totalPoints,
} from '@/lib/skills/planner'
import {
    getTrialIdealWeights,
    recommendAllocationsForTrial,
    scoreBuildAgainstTrial,
    splitBudget,
    TRIAL_WEIGHTS_BY_ID,
} from '@/lib/skills/trialBuildRecommendation'

describe('planner.ts — getRanks / rank normalization (via public API)', () => {
    it('returns 0 for missing key', () => {
        expect(getRanks({}, 'Conditioning_1')).toBe(0)
    })

    it('reads numeric ranks', () => {
        expect(getRanks({ Conditioning_1: 3 }, 'Conditioning_1')).toBe(3)
    })

    it('normalizes string values (no string concat bugs)', () => {
        expect(getRanks({ Conditioning_1: '3' as unknown as number }, 'Conditioning_1')).toBe(3)
    })

    it('treats invalid / non-positive as 0', () => {
        expect(getRanks({ Conditioning_1: NaN as unknown as number }, 'Conditioning_1')).toBe(0)
        expect(getRanks({ Conditioning_1: -1 }, 'Conditioning_1')).toBe(0)
        expect(getRanks({ Conditioning_1: 0 }, 'Conditioning_1')).toBe(0)
    })
})

describe('planner.ts — branchPoints / totalPoints', () => {
    it('sums only nodes in the given branch', () => {
        const allocs = {
            Conditioning_1: 5,
            Mobility_1:     3,
            Survival_1:     2,
        }
        expect(branchPoints(allocs, 'Conditioning')).toBe(5)
        expect(branchPoints(allocs, 'Mobility')).toBe(3)
        expect(branchPoints(allocs, 'Survival')).toBe(2)
    })

    it('ignores unknown keys', () => {
        expect(branchPoints({ bogus_key: 99 } as Record<string, number>, 'Conditioning')).toBe(0)
    })

    it('totalPoints equals sum of three branchPoints', () => {
        const allocs = {
            Conditioning_1: 1,
            Mobility_1:     2,
            Survival_1:     3,
        }
        const sum =
            branchPoints(allocs, 'Conditioning') +
            branchPoints(allocs, 'Mobility') +
            branchPoints(allocs, 'Survival')
        expect(totalPoints(allocs)).toBe(sum)
        expect(totalPoints(allocs)).toBe(6)
    })
})

describe('planner.ts — prerequisitesAnyOf (Crawl Before You Walk)', () => {
    const crawl = SKILL_BY_UID.get('Mobility_5c')
    if (!crawl) throw new Error('Mobility_5c missing from skill data')

    it('unlocks with only Carry the Momentum (4l) when branch points support that path', () => {
        const allocs = {
            Mobility_1: 5, Mobility_2l: 5, Mobility_3l: 5, Mobility_4l: 1,
        }
        const bpts = branchPoints(allocs, 'Mobility')
        expect(isNodeUnlocked(crawl, allocs, bpts)).toBe(true)
    })

    it('unlocks with only Calming Stroll (4r)', () => {
        const allocs = {
            Mobility_1: 5, Mobility_2r: 5, Mobility_3r: 5, Mobility_4r: 1,
        }
        const bpts = branchPoints(allocs, 'Mobility')
        expect(isNodeUnlocked(crawl, allocs, bpts)).toBe(true)
    })

    it('stays locked when neither keystone is taken', () => {
        const allocs = { Mobility_1: 5, Mobility_2l: 5, Mobility_3l: 5 }
        const bpts = branchPoints(allocs, 'Mobility')
        expect(isNodeUnlocked(crawl, allocs, bpts)).toBe(false)
    })
})

describe('planner.ts — cycleNode global cap', () => {
    it('at full expedition cap returns unchanged allocs and global_cap denial message', () => {
        const allocs = { Conditioning_1: 1 }
        const result = cycleNode(allocs, 'Conditioning_1', 1)
        expect(result.allocs).toBe(allocs)
        expect(result.denial).not.toBeNull()
        expect(result.denial!.kind).toBe('global_cap')
        expect(result.denial!.message).toBe(EXPEDITION_POINTS_FULL_MESSAGE)
    })
})

describe('planner.ts — normalizeBuild (expedition cap)', () => {
    it('reduces ranks when total exceeds maxPts', () => {
        const allocs = {
            Conditioning_1: 5,
            Conditioning_2l: 5,
            Conditioning_2r: 5,
        }
        const { allocs: out, clamped } = normalizeBuild(allocs, 10)
        expect(clamped).toBe(true)
        expect(totalPoints(out)).toBe(10)
    })

    it('is idempotent when already within cap', () => {
        const allocs = { Conditioning_1: 3 }
        const { allocs: out, clamped } = normalizeBuild(allocs, 75)
        expect(clamped).toBe(false)
        expect(out).toEqual(allocs)
    })
})

describe('planner.ts — encode / decode round-trip', () => {
    it('round-trips a simple multi-branch build', () => {
        const original = {
            Conditioning_1: 3,
            Mobility_1:   2,
            Survival_1:   1,
        }
        const code = encodeBuildToUrl(original)
        expect(code.length).toBeGreaterThan(0)
        const decoded = decodeBuildFromUrl(code)
        expect(totalPoints(decoded)).toBe(totalPoints(original))
        expect(decoded).toEqual(original)
    })

    it('decodeBuildFromUrlParam matches decode for plain codes', () => {
        const code = encodeBuildToUrl({ Conditioning_1: 2, Mobility_1: 1 })
        expect(decodeBuildFromUrlParam(code)).toEqual(decodeBuildFromUrl(code))
    })

    it('handles a denser build without throwing', () => {
        const code = 'C1:3,C2l:2,C2r:1|M1:5|S2l:1|S1:2'
        const decoded = decodeBuildFromUrl(code)
        expect(totalPoints(decoded)).toBeGreaterThan(0)
        const again = decodeBuildFromUrl(encodeBuildToUrl(decoded))
        expect(totalPoints(again)).toBe(totalPoints(decoded))
    })
})

describe('trialBuildRecommendation.ts — weights & budget', () => {
    it('getTrialIdealWeights returns table mix + primary for known trial', () => {
        const w = getTrialIdealWeights('trial-hornet-havoc')
        expect(w.primary).toBe('conditioning')
        expect(w.conditioning).toBe(TRIAL_WEIGHTS_BY_ID['trial-hornet-havoc'].conditioning)
    })

    it('getTrialIdealWeights falls back for unknown id (balanced third)', () => {
        const w = getTrialIdealWeights('definitely-not-a-real-trial-id')
        expect(w.primary).toBe('balanced')
        expect(w.conditioning).toBeCloseTo(1 / 3, 5)
    })

    it('splitBudget yields integers summing exactly to maxPts', () => {
        const weights = { conditioning: 0.62, mobility: 0.22, survival: 0.16 }
        for (const maxPts of [1, 10, 51, 86]) {
            const b = splitBudget(maxPts, weights)
            expect(b.conditioning + b.mobility + b.survival).toBe(maxPts)
        }
    })

    it('splitBudget returns zeros for non-positive maxPts', () => {
        const b = splitBudget(0, { conditioning: 1, mobility: 0, survival: 0 })
        expect(b.conditioning + b.mobility + b.survival).toBe(0)
    })
})

describe('trialBuildRecommendation.ts — scoring & recommendation', () => {
    const hornet = getTrialById('trial-hornet-havoc')
    if (!hornet) throw new Error('fixture trial missing')

    it('scoreBuildAgainstTrial returns 0 for empty build', () => {
        const { score, label } = scoreBuildAgainstTrial({}, hornet)
        expect(score).toBe(0)
        expect(label).toContain('Allocate')
    })

    it('scoreBuildAgainstTrial returns score in 0–100', () => {
        const { score } = scoreBuildAgainstTrial({ Conditioning_1: 5 }, hornet)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
    })

    it('recommendAllocationsForTrial respects maxPts cap', () => {
        const maxPts = 30
        const rec = recommendAllocationsForTrial(hornet, maxPts)
        expect(totalPoints(rec)).toBeLessThanOrEqual(maxPts)
    })

    it('recommendAllocationsForTrial returns stable deterministic shape', () => {
        const a = recommendAllocationsForTrial(hornet, 40)
        const b = recommendAllocationsForTrial(hornet, 40)
        expect(a).toEqual(b)
    })
})
