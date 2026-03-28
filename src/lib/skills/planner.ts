/**
 * planner.ts
 *
 * Pure skill-tree planner logic: unlock rules, point counting, cascade removal,
 * and compact URL encoding for build sharing.
 *
 * All functions are pure (no side effects) — safe to call in both server and
 * client contexts.
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

// ── Allocation record ─────────────────────────────────────────────────────────

/** Keyed by SkillNode.uid; value = ranks allocated (0 = omit). */
export type BuildAllocations = Record<string, number>

export function emptyBuild(): BuildAllocations { return {} }

export function getRanks(allocs: BuildAllocations, uid: string): number {
    return allocs[uid] ?? 0
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

// ── Unlock logic ──────────────────────────────────────────────────────────────

/**
 * Returns true if the node's prerequisites are met and the branch point gate
 * has been satisfied.
 */
export function isNodeUnlocked(
    node:   SkillNode,
    allocs: BuildAllocations,
    bpts:   number,    // pre-computed branchPoints(allocs, node.branch)
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
 * Returns all UIDs that would become inaccessible if `uid` were zeroed.
 *
 * Used to warn the user or to force-deselect downstream nodes when
 * removing an allocated node.
 *
 * Does NOT include the node itself.
 */
export function getCascadeUIDs(
    uid:    string,
    allocs: BuildAllocations,
): string[] {
    // Simulate removal
    const simulated: BuildAllocations = { ...allocs }
    delete simulated[uid]

    const node = SKILL_BY_UID.get(uid)
    if (!node) return []

    const bpts = branchPoints(simulated, node.branch)
    const toRemove = new Set<string>()

    // BFS over all nodes in the branch that depend (directly or indirectly)
    // on the node being removed.
    const queue = [...getSkillsByBranch(node.branch)]
    let changed = true
    while (changed) {
        changed = false
        for (const n of queue) {
            if (toRemove.has(n.uid)) continue
            if ((simulated[n.uid] ?? 0) === 0) continue
            const unlocked = isNodeUnlocked(n, simulated, bpts)
            if (!unlocked) {
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
 * Returns the updated allocations (new object).
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
        // Cascade: remove downstream nodes that are now locked
        for (const cascadeUid of getCascadeUIDs(uid, next)) {
            delete next[cascadeUid]
        }
    } else {
        next[uid] = clamped
    }

    return next
}

/**
 * Convenience: toggle single-rank node, or cycle multi-rank node.
 *
 * - Single rank (maxRanks=1): toggle 0 ↔ 1
 * - Multi rank (maxRanks>1):  +1 rank per click; reset to 0 when maxed
 */
export function cycleNode(allocs: BuildAllocations, uid: string): BuildAllocations {
    const node = SKILL_BY_UID.get(uid)
    if (!node) return allocs
    const bpts  = branchPoints(allocs, node.branch)
    const state = getNodeState(node, allocs, bpts)
    if (state === 'locked') return allocs

    const current  = allocs[uid] ?? 0
    const newRanks = current >= node.maxRanks ? 0 : current + 1
    return applyAllocation(allocs, uid, newRanks)
}

/** Right-click / decrement action: remove one rank. */
export function decrementNode(allocs: BuildAllocations, uid: string): BuildAllocations {
    const current = allocs[uid] ?? 0
    if (current <= 0) return allocs
    return applyAllocation(allocs, uid, current - 1)
}

// ── Build reset ───────────────────────────────────────────────────────────────

export function resetBranch(allocs: BuildAllocations, branch: SkillBranch): BuildAllocations {
    const next: BuildAllocations = { ...allocs }
    for (const n of getSkillsByBranch(branch)) {
        delete next[n.uid]
    }
    return next
}

export function resetAll(): BuildAllocations { return {} }

// ── Build validation ──────────────────────────────────────────────────────────

/**
 * Validates an allocations object, clamping and removing any invalid entries.
 * Safe to call with untrusted input (URL params, localStorage, API response).
 */
export function sanitizeBuild(raw: unknown): BuildAllocations {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out: BuildAllocations = {}
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
        const node = SKILL_BY_UID.get(key)
        if (!node) continue
        const n = Math.floor(Number(val))
        if (!Number.isFinite(n) || n <= 0) continue
        out[key] = Math.min(n, node.maxRanks)
    }
    return out
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

/** Decodes a compact URL string back to BuildAllocations. */
export function decodeBuildFromUrl(encoded: string): BuildAllocations {
    if (!encoded) return {}
    const allocs: BuildAllocations = {}
    // Split by both | and ,
    const chunks = encoded.split(/[|,]/)
    for (const chunk of chunks) {
        const match = /^([CMS])(.+):(\d+)$/.exec(chunk.trim())
        if (!match) continue
        const [, code, nodeId, rankStr] = match
        const branch = CODE_TO_BRANCH[code]
        if (!branch) continue
        const uid    = toUid(branch, nodeId)
        const node   = SKILL_BY_UID.get(uid)
        if (!node) continue
        const r = Math.min(parseInt(rankStr, 10), node.maxRanks)
        if (r > 0) allocs[uid] = r
    }
    return sanitizeBuild(allocs)
}

// ── Summary helpers ───────────────────────────────────────────────────────────

export type BuildSummaryRow = {
    branch:    SkillBranch
    spent:     number
    maxPossible: number
    selected:  Array<{ uid: string; name: string; description: string; ranks: number; maxRanks: number }>
}

export function buildSummary(allocs: BuildAllocations): BuildSummaryRow[] {
    return BRANCHES.map((branch) => {
        const nodes = getSkillsByBranch(branch)
        const spent = branchPoints(allocs, branch)
        const maxPossible = nodes.reduce((s, n) => s + n.maxRanks, 0)
        const selected = nodes
            .filter((n) => (allocs[n.uid] ?? 0) > 0)
            .map((n) => ({
                uid:         n.uid,
                name:        n.name,
                description: n.description,
                ranks:        allocs[n.uid] ?? 0,
                maxRanks:     n.maxRanks,
            }))
        return { branch, spent, maxPossible, selected }
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
