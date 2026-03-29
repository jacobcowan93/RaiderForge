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
 * Expedition-tier point totals.
 *
 * index 0 = base (no expeditions completed)
 * index 1 = after first expedition
 * index 2 = after second expedition
 */
export const EXPEDITION_CAPS = [75, 81, 86] as const
export type  ExpeditionLevel  = 0 | 1 | 2

/**
 * Default planner caps.  Components may override `totalPoints` at runtime
 * by passing a `maxPts` argument to `cycleNode` and friends.
 */
export const PLANNER_CAPS: PlannerCaps = {
    totalPoints: EXPEDITION_CAPS[0],   // 75 — base tier
    branchPoints: {
        Conditioning: null,   // no per-branch cap (global cap is the constraint)
        Mobility:     null,
        Survival:     null,
    },
}
