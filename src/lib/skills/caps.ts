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

// 86 total skill points for a Raider who has completed Expedition 1 and Expedition 2
// (base + 5 from Expedition 1 + 5 from Expedition 2), matching current ARC Raiders design.
export const MAX_EXPEDITION_POINTS_FULL = 86 as const

/**
 * Sidebar presets: index 0 = base only (75), 1 = after Expedition 1 (81), 2 = both (86).
 */
export const EXPEDITION_CAPS = [75, 81, MAX_EXPEDITION_POINTS_FULL] as const
export type  ExpeditionLevel  = 0 | 1 | 2

/**
 * Default global cap matches fully progressed Raider ({@link MAX_EXPEDITION_POINTS_FULL}).
 * Lower tiers pass `maxPts` from the UI (`EXPEDITION_CAPS[level]`).
 */
export const PLANNER_CAPS: PlannerCaps = {
    totalPoints: MAX_EXPEDITION_POINTS_FULL,
    branchPoints: {
        Conditioning: null,   // no per-branch cap (global cap is the constraint)
        Mobility:     null,
        Survival:     null,
    },
}
