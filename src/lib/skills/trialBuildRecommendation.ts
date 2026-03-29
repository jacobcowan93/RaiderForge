/**
 * Client-side trial ↔ skill tree heuristics.
 *
 * Maps Weekly Trial catalog entries to suggested expedition point spreads and synergy labels.
 * All logic is pure and safe to run in the browser.
 */

import type { SkillBranch } from '@/data/skillTree'
import { BRANCHES, getSkillsByBranch, type SkillNode } from '@/data/skillTree'
import type { TrialBranch, WeeklyTrial } from '@/data/trials'
import { getTrialById } from '@/data/trials'
import {
    type BuildAllocations,
    applyAllocation,
    branchPoints,
    emptyBuild,
    isNodeUnlocked as plannerIsNodeUnlocked,
    normalizeBuild,
    totalPoints,
} from '@/lib/skills/planner'

/** Per-branch ideal mix for a trial (each row sums to 1.0). */
export type TrialIdealMix = {
    conditioning: number
    mobility: number
    survival: number
}

/**
 * Hand-tuned ideal point mix per trial id. Keys match `WeeklyTrial.id`.
 * For ids not listed here, {@link getTrialIdealWeights} falls back to `WeeklyTrial.branch` (one-hot).
 */
export const TRIAL_WEIGHTS_BY_ID: Record<string, TrialIdealMix> = {
    'trial-hornet-havoc': { conditioning: 0.62, mobility: 0.22, survival: 0.16 },
    'trial-carriable-dash': { conditioning: 0.12, mobility: 0.72, survival: 0.16 },
    'trial-bombardier-siege': { conditioning: 0.2, mobility: 0.28, survival: 0.52 },
    'trial-lightning-gauntlet': { conditioning: 0.45, mobility: 0.4, survival: 0.15 },
    'trial-flying-arc-hunt': { conditioning: 0.18, mobility: 0.62, survival: 0.2 },
    'trial-frostline': { conditioning: 0.15, mobility: 0.25, survival: 0.6 },
}

const LOWER_TO_SKILL: Record<keyof TrialIdealMix, SkillBranch> = {
    conditioning: 'Conditioning',
    mobility: 'Mobility',
    survival: 'Survival',
}

/** One-hot mix from catalog `branch` when no custom row exists in {@link TRIAL_WEIGHTS_BY_ID}. */
function weightsFromTrialBranch(branch: TrialBranch): TrialIdealMix {
    if (branch === 'conditioning') return { conditioning: 1, mobility: 0, survival: 0 }
    if (branch === 'mobility') return { conditioning: 0, mobility: 1, survival: 0 }
    return { conditioning: 0, mobility: 0, survival: 1 }
}

function primaryBranchLabel(mix: TrialIdealMix): keyof TrialIdealMix {
    let max = -1
    let key: keyof TrialIdealMix = 'conditioning'
    ;(['conditioning', 'mobility', 'survival'] as const).forEach((k) => {
        if (mix[k] > max) {
            max = mix[k]
            key = k
        }
    })
    return key
}


/**
 * Converts fractional weights into integer branch budgets that sum exactly to `maxPts`.
 */
export function splitBudget(maxPts: number, weights: TrialIdealMix): TrialIdealMix & Record<keyof TrialIdealMix, number> {
    if (maxPts <= 0) {
        return { conditioning: 0, mobility: 0, survival: 0 }
    }
    const keys = ['conditioning', 'mobility', 'survival'] as const
    const raw = keys.map((k) => ({ k, v: Math.round(maxPts * weights[k]) }))
    let sum = raw.reduce((s, x) => s + x.v, 0)
    let i = 0
    while (sum !== maxPts) {
        if (sum < maxPts) {
            raw[i % 3]!.v += 1
            sum += 1
        } else if (raw[i % 3]!.v > 0) {
            raw[i % 3]!.v -= 1
            sum -= 1
        }
        i += 1
        if (i > maxPts * 8) break
    }
    return {
        conditioning: raw.find((x) => x.k === 'conditioning')!.v,
        mobility: raw.find((x) => x.k === 'mobility')!.v,
        survival: raw.find((x) => x.k === 'survival')!.v,
    }
}

/**
 * Walks `branchNodes` in data order. Adds one rank at a time while the node is unlocked,
 * branch budget allows, and global expedition cap allows. Restarts from the first node after each successful add.
 *
 * @param maxGlobalPts — expedition tier cap; defaults so older 4-arg call sites still type-check.
 */
export function fillBranchGreedy(
    branchNodes: SkillNode[],
    budget: number,
    currentAllocs: BuildAllocations,
    /** Must evaluate unlock against the *current* snapshot (passed as second arg) to avoid stale closures. */
    isNodeUnlocked: (nodeId: string, allocs: BuildAllocations) => boolean,
    maxGlobalPts: number = Number.MAX_SAFE_INTEGER,
): BuildAllocations {
    const branch = branchNodes[0]?.branch
    if (!branch || budget <= 0) {
        return { ...currentAllocs }
    }

    let allocs: BuildAllocations = { ...currentAllocs }

    while (true) {
        if (branchPoints(allocs, branch) >= budget) break
        if (totalPoints(allocs) >= maxGlobalPts) break

        let progressed = false
        for (const node of branchNodes) {
            if (branchPoints(allocs, branch) >= budget) break
            if (totalPoints(allocs) >= maxGlobalPts) break

            const ranks = allocs[node.uid] ?? 0
            if (ranks >= node.maxRanks) continue
            if (!isNodeUnlocked(node.uid, allocs)) continue

            allocs = applyAllocation(allocs, node.uid, ranks + 1)
            progressed = true
            break
        }
        if (!progressed) break
    }

    return allocs
}

/**
 * Ideal weights for a trial: custom table, else catalog branch one-hot, else uniform third.
 */
export function getTrialIdealWeights(trialId: string): TrialIdealMix & { primary: string } {
    const custom = TRIAL_WEIGHTS_BY_ID[trialId]
    if (custom) {
        return { ...custom, primary: primaryBranchLabel(custom) }
    }
    const trial = getTrialById(trialId)
    if (!trial) {
        const third = 1 / 3
        const mix = { conditioning: third, mobility: third, survival: third }
        return { ...mix, primary: 'balanced' }
    }
    const mix = weightsFromTrialBranch(trial.branch)
    return { ...mix, primary: trial.branch }
}

/**
 * Builds a cap-valid recommendation: split budget → greedy fill per branch (descending budget) → {@link normalizeBuild}.
 *
 * Client-side heuristic only. Not official game mechanics.
 */
export function recommendAllocationsForTrial(trial: WeeklyTrial, maxPts: number): BuildAllocations {
    const ideal = getTrialIdealWeights(trial.id)
    const weights: TrialIdealMix = {
        conditioning: ideal.conditioning,
        mobility: ideal.mobility,
        survival: ideal.survival,
    }
    const budgets = splitBudget(maxPts, weights)

    const branchBudget: Record<SkillBranch, number> = {
        Conditioning: budgets.conditioning,
        Mobility: budgets.mobility,
        Survival: budgets.survival,
    }

    const order = [...BRANCHES].sort((a, b) => branchBudget[b] - branchBudget[a])

    let allocs = emptyBuild()
    for (const branch of order) {
        const nodes = getSkillsByBranch(branch)
        const b = branchBudget[branch]
        allocs = fillBranchGreedy(
            nodes,
            b,
            allocs,
            (nodeId, state) => {
                const n = nodes.find((x) => x.uid === nodeId)
                if (!n) return false
                const bpts = branchPoints(state, branch)
                return plannerIsNodeUnlocked(n, state, bpts)
            },
            maxPts,
        )
    }

    const { allocs: normalized } = normalizeBuild(allocs, maxPts)
    return normalized
}

/**
 * Compares current point fractions vs ideal weights. Returns a 0–100 score and a short label.
 *
 * Client-side heuristic only. Not official game mechanics.
 */
export function scoreBuildAgainstTrial(
    currentAllocs: BuildAllocations,
    trial: WeeklyTrial,
): { score: number; label: string } {
    const ideal = getTrialIdealWeights(trial.id)
    const total = totalPoints(currentAllocs)

    if (total <= 0) {
        return { score: 0, label: 'Allocate points to compare' }
    }

    let penalty = 0
    ;(['conditioning', 'mobility', 'survival'] as const).forEach((k) => {
        const idealFrac = ideal[k]
        const skillBranch = LOWER_TO_SKILL[k]
        const actualFrac = branchPoints(currentAllocs, skillBranch) / total
        penalty += Math.abs(idealFrac - actualFrac)
    })

    const score = Math.max(0, Math.min(100, Math.round(100 - (penalty / 2) * 100)))

    const primaryIdeal = primaryBranchLabel({
        conditioning: ideal.conditioning,
        mobility: ideal.mobility,
        survival: ideal.survival,
    })
    const userPrimary = BRANCHES.reduce((a, b) =>
        branchPoints(currentAllocs, b) > branchPoints(currentAllocs, a) ? b : a,
    )
    const primaryIdealSkill = LOWER_TO_SKILL[primaryIdeal]
    const primaryMatch = userPrimary === primaryIdealSkill && branchPoints(currentAllocs, userPrimary) > 0

    const labelPretty = (k: keyof TrialIdealMix): string => {
        if (k === 'conditioning') return 'Conditioning'
        if (k === 'mobility') return 'Mobility'
        return 'Survival'
    }

    let label: string
    if (score >= 78 && primaryMatch) {
        label = `High ${labelPretty(primaryIdeal)} synergy`
    } else if (score >= 65 && Math.max(ideal.conditioning, ideal.mobility, ideal.survival) < 0.42) {
        label = 'Balanced build'
    } else if (score >= 60) {
        label = primaryMatch ? `Solid ${labelPretty(primaryIdeal)} alignment` : `Mixed build — ok for ${trial.name}`
    } else if (branchPoints(currentAllocs, 'Conditioning') / total > 0.45) {
        label = 'Conditioning focused'
    } else if (branchPoints(currentAllocs, 'Mobility') / total > 0.45) {
        label = 'Mobility focused'
    } else if (branchPoints(currentAllocs, 'Survival') / total > 0.45) {
        label = 'Survival focused'
    } else if (score >= 40) {
        label = 'Moderate fit — consider the recommended spread'
    } else {
        label = 'Low synergy — recommended build may help more'
    }

    return { score, label }
}
