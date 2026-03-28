/**
 * planner.ts
 *
 * Pure skill-tree planner logic: unlock rules, point counting, cascade
 * removal, hard-cap enforcement, and compact URL encoding for build sharing.
 *
 * All functions are pure (no side effects) — safe to call in both server and
 * client contexts.
 *
 * Cap enforcement is data-driven: all limits come from caps.ts and are applied
 * consistently across interactive allocation, URL import, and localStorage
 * restore.
 */

import {
    SKILL_BY_UID,
    SKILL_NODES,
    type SkillBranch,
    type SkillNode,
    type SkillNodeState,
    getSkillsByBranch,
    toUid,
    BRANCHES,
} from '@/data/skillTree'
import { PLANNER_CAPS } from './caps'

// ── Allocation record ─────────────────────────────────────────────────────────

/** Keyed by SkillNode.uid; value = ranks allocated (omit key for 0). */
export type BuildAllocations = Record<string, number>

export function emptyBuild(): BuildAllocations { return {} }

export function getRanks(allocs: BuildAllocations, uid: string): number {
    return allocs[uid] ?? 0
}

// ── Cap result types ──────────────────────────────────────────────────────────

/**
 * Describes why an allocation attempt was blocked by a hard cap.
 * Returned by `cycleNode` when adding a rank would violate a limit.
 */
export type CapDenial = {
    /** Machine-readable discriminant for routing different UI copy. */
    kind:    'global_cap' | 'branch_cap'
    /** Human-readable, ready to display verbatim in the UI. */
    message: string
    /** The cap value that was hit. */
    limit:   number
}

/**
 * Result of `cycleNode`.
 * When `denial` is non-null the `allocs` object is unchanged and the UI
 * should surface the denial message to the user.
 */
export type AllocationResult = {
    allocs: BuildAllocations
    denial: CapDenial | null
}

/**
 * Result of `normalizeBuild` and `decodeAndNormalizeBuild`.
 * `clamped` is true if any ranks were reduced to satisfy caps.
 * `changes` is a human-readable list suitable for display in an import panel.
 */
export type NormalizeResult = {
    allocs:  BuildAllocations
    clamped: boolean
    changes: string[]
}

// ── Point counting ────────────────────────────────────────────────────────────

/** Total ranks spent in a specific branch. */
export function branchPoints(allocs: BuildAllocations, branch: SkillBranch): number {
    return getSkillsByBranch(branch).reduce(
        (sum, n) => sum + (allocs[n.uid] ?? 0),
        0,
    )
}

/** Total ranks spent across all branches. */
export function totalPoints(allocs: BuildAllocations): number {
    return BRANCHES.reduce((sum, b) => sum + branchPoints(allocs, b), 0)
}

/** Returns spent + configured cap for a branch (null cap = no branch limit). */
export function branchPointsWithCap(
    allocs: BuildAllocations,
    branch: SkillBranch,
): { spent: number; cap: number | null } {
    return {
        spent: branchPoints(allocs, branch),
        cap:   PLANNER_CAPS.branchPoints[branch] ?? null,
    }
}

/** Returns spent + configured global cap (null cap = no global limit). */
export function totalPointsWithCap(allocs: BuildAllocations): { spent: number; cap: number | null } {
    return {
        spent: totalPoints(allocs),
        cap:   PLANNER_CAPS.totalPoints,
    }
}

// ── Internal cap check ────────────────────────────────────────────────────────

/**
 * Checks whether adding one rank to `node` would violate a hard cap.
 * Returns the first violation found, or null if all caps are clear.
 * Branch cap is checked before global cap.
 */
function checkAddRankCaps(allocs: BuildAllocations, node: SkillNode): CapDenial | null {
    const branchCap = PLANNER_CAPS.branchPoints[node.branch] ?? null
    if (branchCap !== null) {
        const bpts = branchPoints(allocs, node.branch)
        if (bpts >= branchCap) {
            return {
                kind:    'branch_cap',
                message: `${node.branch} is at its point cap (${branchCap} pts)`,
                limit:   branchCap,
            }
        }
    }

    if (PLANNER_CAPS.totalPoints !== null) {
        const tpts = totalPoints(allocs)
        if (tpts >= PLANNER_CAPS.totalPoints) {
            return {
                kind:    'global_cap',
                message: `Maximum of ${PLANNER_CAPS.totalPoints} expedition points reached`,
                limit:   PLANNER_CAPS.totalPoints,
            }
        }
    }

    return null
}

// ── Unlock logic ──────────────────────────────────────────────────────────────

/**
 * Returns true if the node's prerequisites are met and the branch point gate
 * has been satisfied.
 */
export function isNodeUnlocked(
    node:   SkillNode,
    allocs: BuildAllocations,
    bpts:   number,   // pre-computed branchPoints(allocs, node.branch)
): boolean {
    if (node.pointGate > 0 && bpts < node.pointGate) return false
    return node.prerequisites.every((prereqId) => {
        const uid = toUid(node.branch, prereqId)
        return (allocs[uid] ?? 0) >= 1
    })
}

/**
 * Returns the visual state of a node.
 *
 * locked    — prerequisites or point gate not met
 * available — unlocked, 0 ranks allocated
 * partial   — 1..(maxRanks-1) ranks allocated
 * maxed     — maxRanks ranks allocated
 *
 * Note: a node can be `available` even if a cap would block adding a rank.
 * Cap violations are surfaced via `cycleNode`'s `CapDenial`, not via state.
 */
export function getNodeState(
    node:   SkillNode,
    allocs: BuildAllocations,
    bpts:   number,
): SkillNodeState {
    const ranks = allocs[node.uid] ?? 0
    if (!isNodeUnlocked(node, allocs, bpts)) return 'locked'
    if (ranks === 0)             return 'available'
    if (ranks < node.maxRanks)   return 'partial'
    return 'maxed'
}

// ── Cascade logic ─────────────────────────────────────────────────────────────

/**
 * Returns all UIDs that would become inaccessible if `uid` were zeroed out.
 * Does NOT include the node itself.
 */
export function getCascadeUIDs(
    uid:    string,
    allocs: BuildAllocations,
): string[] {
    const simulated: BuildAllocations = { ...allocs }
    delete simulated[uid]

    const node = SKILL_BY_UID.get(uid)
    if (!node) return []

    const bpts     = branchPoints(simulated, node.branch)
    const toRemove = new Set<string>()
    const queue    = [...getSkillsByBranch(node.branch)]
    let changed    = true

    while (changed) {
        changed = false
        for (const n of queue) {
            if (toRemove.has(n.uid))        continue
            if ((simulated[n.uid] ?? 0) === 0) continue
            if (!isNodeUnlocked(n, simulated, bpts)) {
                toRemove.add(n.uid)
                delete simulated[n.uid]
                changed = true
            }
        }
    }

    return [...toRemove]
}

/**
 * Applies an allocation change and cascades removals automatically.
 * Lower-level primitive — does NOT check global/branch caps.
 * Use `cycleNode` for cap-guarded interactive allocation.
 */
export function applyAllocation(
    allocs:   BuildAllocations,
    uid:      string,
    newRanks: number,
): BuildAllocations {
    const node = SKILL_BY_UID.get(uid)
    if (!node) return allocs

    const clamped = Math.max(0, Math.min(newRanks, node.maxRanks))
    const next: BuildAllocations = { ...allocs }

    if (clamped <= 0) {
        delete next[uid]
        for (const cascadeUid of getCascadeUIDs(uid, next)) {
            delete next[cascadeUid]
        }
    } else {
        next[uid] = clamped
    }

    return next
}

/**
 * Click / keyboard allocation action.
 *
 * - Single-rank node (maxRanks=1): toggle 0 ↔ 1
 * - Multi-rank node (maxRanks>1):  +1 per call; wraps back to 0 when maxed
 *
 * Returns an `AllocationResult`.  When `denial` is non-null the `allocs` are
 * unchanged and the caller should surface `denial.message` to the user.
 * Cycling a maxed node back to 0 never triggers a cap denial.
 */
export function cycleNode(allocs: BuildAllocations, uid: string): AllocationResult {
    const node = SKILL_BY_UID.get(uid)
    if (!node) return { allocs, denial: null }

    const bpts  = branchPoints(allocs, node.branch)
    const state = getNodeState(node, allocs, bpts)
    if (state === 'locked') return { allocs, denial: null }

    const current = allocs[uid] ?? 0

    // Cycling a maxed node back to 0 — removal never violates a cap
    if (current >= node.maxRanks) {
        return { allocs: applyAllocation(allocs, uid, 0), denial: null }
    }

    // Adding a rank — check all caps before applying
    const denial = checkAddRankCaps(allocs, node)
    if (denial) return { allocs, denial }

    return { allocs: applyAllocation(allocs, uid, current + 1), denial: null }
}

/**
 * Right-click / keyboard −1 action: remove one rank.
 * Caps are never checked when removing ranks.
 */
export function decrementNode(allocs: BuildAllocations, uid: string): BuildAllocations {
    const current = allocs[uid] ?? 0
    if (current <= 0) return allocs
    return applyAllocation(allocs, uid, current - 1)
}

// ── Build reset ───────────────────────────────────────────────────────────────

export function resetBranch(allocs: BuildAllocations, branch: SkillBranch): BuildAllocations {
    const next: BuildAllocations = { ...allocs }
    for (const n of getSkillsByBranch(branch)) delete next[n.uid]
    return next
}

export function resetAll(): BuildAllocations { return {} }

// ── Build normalization (cap enforcement) ─────────────────────────────────────

/**
 * Applies global and per-branch caps to an already per-node-valid
 * `BuildAllocations`, reducing ranks deterministically until all caps are
 * satisfied.
 *
 * Processing order: Conditioning → Mobility → Survival, node-by-node within
 * each branch.  First-come-first-served: earlier nodes keep their ranks when
 * the cap is hit.
 *
 * Idempotent: calling it on already-normalized allocs returns the same result.
 *
 * This function is the single enforcement point for global + branch caps.
 * It does NOT re-check SkillNode.maxRanks — call `sanitizeBuild` first.
 */
export function normalizeBuild(allocs: BuildAllocations): NormalizeResult {
    const out: BuildAllocations = {}
    const changes: string[] = []

    for (const branch of BRANCHES) {
        const nodes     = getSkillsByBranch(branch)
        const branchCap = PLANNER_CAPS.branchPoints[branch] ?? null
        let   bRunning  = 0

        for (const node of nodes) {
            const rawRanks = allocs[node.uid] ?? 0
            if (rawRanks <= 0) continue

            let allow = rawRanks

            // Global cap
            if (PLANNER_CAPS.totalPoints !== null) {
                const tRunning  = totalPoints(out)
                const remaining = PLANNER_CAPS.totalPoints - tRunning
                allow = remaining <= 0 ? 0 : Math.min(allow, remaining)
            }

            // Per-branch cap
            if (branchCap !== null) {
                const remaining = branchCap - bRunning
                allow = remaining <= 0 ? 0 : Math.min(allow, remaining)
            }

            if (allow < rawRanks) {
                changes.push(
                    allow === 0
                        ? `"${node.name}" removed — point cap reached`
                        : `"${node.name}" reduced to ${allow} of ${rawRanks} ranks — point cap reached`,
                )
            }

            if (allow > 0) {
                out[node.uid] = allow
                bRunning += allow
            }
        }
    }

    return { allocs: out, clamped: changes.length > 0, changes }
}

// ── Build validation ──────────────────────────────────────────────────────────

/**
 * Validates an allocations object and applies all caps.
 * Step 1: per-node schema check (unknown UIDs, non-numeric values, ranks above
 *         SkillNode.maxRanks are silently discarded/clamped).
 * Step 2: global + branch cap normalization via `normalizeBuild`.
 *
 * Safe to call with fully untrusted input (URL params, localStorage, API).
 */
export function sanitizeBuild(raw: unknown): BuildAllocations {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const perNode: BuildAllocations = {}
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
        const node = SKILL_BY_UID.get(key)
        if (!node) continue
        const n = Math.floor(Number(val))
        if (!Number.isFinite(n) || n <= 0) continue
        perNode[key] = Math.min(n, node.maxRanks)
    }
    const { allocs } = normalizeBuild(perNode)
    return allocs
}

// ── URL state codec ───────────────────────────────────────────────────────────
//
// Compact format:  "C1:3,C2l:1,C4l:1|M1:5,M2l:2|S1:1"
//   Branch codes:  C = Conditioning, M = Mobility, S = Survival
//   Each chunk:    {BranchCode}{nodeId}:{ranks}
//   Branches:      separated by "|"
//   Chunks:        separated by ","
//

const BRANCH_CODE: Record<SkillBranch, string> = {
    Conditioning: 'C',
    Mobility:     'M',
    Survival:     'S',
}
const CODE_TO_BRANCH: Record<string, SkillBranch> = {
    C: 'Conditioning',
    M: 'Mobility',
    S: 'Survival',
}

/**
 * Shared URL code parser.
 * Applies per-node clamping (SkillNode.maxRanks) but NOT global/branch caps.
 * Call `normalizeBuild` after this to get a fully cap-valid result.
 */
function _parseBuildCode(code: string): BuildAllocations {
    if (!code) return {}
    const allocs: BuildAllocations = {}
    for (const chunk of code.split(/[|,]/)) {
        const match = /^([CMS])(.+):(\d+)$/.exec(chunk.trim())
        if (!match) continue
        const [, codeChar, nodeId, rankStr] = match
        const branch = CODE_TO_BRANCH[codeChar]
        if (!branch) continue
        const uid  = toUid(branch, nodeId)
        const node = SKILL_BY_UID.get(uid)
        if (!node) continue
        const r = Math.min(parseInt(rankStr, 10), node.maxRanks)
        if (r > 0) allocs[uid] = r
    }
    return allocs
}

/** Encodes an allocations object to a compact URL-safe string. */
export function encodeBuildToUrl(allocs: BuildAllocations): string {
    const parts: string[] = []
    for (const branch of BRANCHES) {
        const chunks: string[] = []
        for (const node of getSkillsByBranch(branch)) {
            const r = allocs[node.uid] ?? 0
            if (r > 0) chunks.push(`${BRANCH_CODE[branch]}${node.id}:${r}`)
        }
        if (chunks.length) parts.push(chunks.join(','))
    }
    return parts.join('|')
}

/**
 * Decodes a compact URL string back to `BuildAllocations`.
 * Always returns a fully cap-valid, schema-valid result.
 * Backward compatible — existing callers continue to work unchanged.
 */
export function decodeBuildFromUrl(encoded: string): BuildAllocations {
    const { allocs } = normalizeBuild(_parseBuildCode(encoded))
    return allocs
}

/**
 * Decodes a URL string and returns the full normalization report.
 * Use in the ImportPanel so the UI can surface what (if anything) was clamped.
 */
export function decodeAndNormalizeBuild(code: string): NormalizeResult {
    return normalizeBuild(_parseBuildCode(code))
}

// ── Summary helpers ───────────────────────────────────────────────────────────

export type BuildSummaryRow = {
    branch:      SkillBranch
    spent:       number
    maxPossible: number
    /** Configured branch cap, or null if no branch-level cap is set. */
    cap:         number | null
    selected:    Array<{
        uid:         string
        name:        string
        description: string
        ranks:       number
        maxRanks:    number
    }>
}

export function buildSummary(allocs: BuildAllocations): BuildSummaryRow[] {
    return BRANCHES.map((branch) => {
        const nodes      = getSkillsByBranch(branch)
        const spent      = branchPoints(allocs, branch)
        const maxPossible = nodes.reduce((s, n) => s + n.maxRanks, 0)
        const selected   = nodes
            .filter((n) => (allocs[n.uid] ?? 0) > 0)
            .map((n) => ({
                uid:         n.uid,
                name:        n.name,
                description: n.description,
                ranks:       allocs[n.uid] ?? 0,
                maxRanks:    n.maxRanks,
            }))
        return {
            branch,
            spent,
            maxPossible,
            cap:      PLANNER_CAPS.branchPoints[branch] ?? null,
            selected,
        }
    })
}

// ── Precomputed node list for all branches ────────────────────────────────────

/** All nodes with their grid position, for use in rendering. */
export type PlannedNode = SkillNode & {
    row: number
    col: number
}

export function getPlannedNodes(branch: SkillBranch): PlannedNode[] {
    return SKILL_NODES
        .filter((n) => n.branch === branch)
        .map((n) => {
            const prefix = n.id === '1' ? '1' : n.id[0]
            const rowMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 }
            const colMap: Record<string, number> = {
                '1':  1,
                '2l': 0, '2r': 2,
                '3l': 0, '3r': 2,
                '4l': 0, '4r': 2,
                '5l': 0, '5c': 1, '5r': 2,
                '6l': 0, '6c': 1, '6r': 2,
                '7l': 0, '7r': 2,
            }
            return {
                ...n,
                row: rowMap[prefix] ?? 0,
                col: colMap[n.id]   ?? 1,
            }
        })
}
