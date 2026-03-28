/**
 * caps.ts
 *
 * Hard caps for the RaiderForge skill tree planner.
 *
 * These are the ONLY values that need to change to adjust limits across the
 * entire planner.  All enforcement lives in planner.ts — nothing here touches
 * UI or game logic directly.
 *
 * Set any numeric value to `null` to disable that specific cap.
 *
 * Current values are based on available early-access game data and are
 * subject to change with patches.  Per-node rank limits (SkillNode.maxRanks)
 * are defined in skillTree.ts and enforced independently.
 */

import type { SkillBranch } from '@/data/skillTree'

export type PlannerCaps = {
    /**
     * Maximum expedition points spendable across ALL branches combined.
     * `null` = no global cap enforced.
     */
    totalPoints: number | null

    /**
     * Per-branch maximum expedition points.
     * Omit a branch or set its value to `null` to apply no branch-level cap.
     */
    branchPoints: Partial<Record<SkillBranch, number | null>>
}

/**
 * Edit these numbers to adjust caps.  Everything else updates automatically.
 *
 * totalPoints = 51  →  one fully-maxed branch worth of points across all
 *                       three branches combined.  Forces meaningful choices.
 */
export const PLANNER_CAPS: PlannerCaps = {
    totalPoints: 51,
    branchPoints: {
        Conditioning: null,   // no per-branch cap (global cap is the constraint)
        Mobility:     null,
        Survival:     null,
    },
}
