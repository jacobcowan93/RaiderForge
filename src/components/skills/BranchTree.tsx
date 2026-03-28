'use client'

import { useMemo } from 'react'
import type { SkillBranch } from '@/data/skillTree'
import { BRANCH_META, TREE_EDGES } from '@/data/skillTree'
import {
    type BuildAllocations,
    type PlannedNode,
    branchPoints,
    getNodeState,
    getPlannedNodes,
    cycleNode,
    decrementNode,
} from '@/lib/skills/planner'
import { SkillNodeBtn } from './SkillNodeBtn'

// ── Layout constants ──────────────────────────────────────────────────────────
//
// The branch tree is rendered into a relative container using a 7-row × 3-col
// grid.  SVG connector lines are drawn on an absolute overlay using the same
// percentage coordinates.
//
//   Columns (percentage of container width):
//     col 0 → 16.7%   col 1 → 50%   col 2 → 83.3%
//
//   Rows (percentage of container height):
//     row 0 →  7%   (root)
//     row 1 → 21%
//     row 2 → 35%
//     row 3 → 49%   ← point gate: 15 pts
//     row 4 → 63%
//     row 5 → 77%
//     row 6 → 91%   ← point gate: 36 pts (capstones)

const COL_PCT = [16.7, 50, 83.3] as const
const ROW_PCT = [7, 21, 35, 49, 63, 77, 91] as const

// ── Gate indicator ────────────────────────────────────────────────────────────

interface GateLineProps {
    rowPct:    number   // y-center of the gate row (%)
    pts:       number   // current branch points
    required:  number   // points required
    color:     string   // branch hex
}

function GateLine({ rowPct, pts, required, color }: GateLineProps) {
    const met = pts >= required
    return (
        <div
            className="absolute left-[5%] right-[5%] flex items-center gap-2 pointer-events-none"
            style={{ top: `calc(${rowPct}% - 28px)`, zIndex: 3 }}
        >
            <div
                className="flex-1 h-px transition-colors duration-300"
                style={{ background: met ? `${color}60` : 'rgba(255,255,255,0.06)' }}
            />
            <span
                className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-300"
                style={{ color: met ? `${color}cc` : 'rgba(255,255,255,0.20)' }}
            >
                {pts}/{required} pts
            </span>
            <div
                className="flex-1 h-px transition-colors duration-300"
                style={{ background: met ? `${color}60` : 'rgba(255,255,255,0.06)' }}
            />
        </div>
    )
}

// ── SVG connector layer ───────────────────────────────────────────────────────

interface ConnectorLayerProps {
    nodes:  PlannedNode[]
    allocs: BuildAllocations
    color:  string
}

function ConnectorLayer({ nodes, allocs, color }: ConnectorLayerProps) {
    const nodeByIdRef = useMemo(() => {
        const m = new Map<string, PlannedNode>()
        for (const n of nodes) m.set(n.id, n)
        return m
    }, [nodes])

    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ zIndex: 1 }}
        >
            {TREE_EDGES.map(([fromId, toId]) => {
                const from = nodeByIdRef.get(fromId)
                const to   = nodeByIdRef.get(toId)
                if (!from || !to) return null

                const x1 = COL_PCT[from.col]
                const y1 = ROW_PCT[from.row as 0|1|2|3|4|5|6]
                const x2 = COL_PCT[to.col]
                const y2 = ROW_PCT[to.row as 0|1|2|3|4|5|6]

                const fromAllocated = (allocs[from.uid] ?? 0) > 0
                const toAllocated   = (allocs[to.uid]   ?? 0) > 0
                const active        = fromAllocated && toAllocated

                return (
                    <line
                        key={`${fromId}-${toId}`}
                        x1={x1} y1={y1}
                        x2={x2} y2={y2}
                        stroke={active ? color : 'rgba(255,255,255,0.07)'}
                        strokeWidth={active ? 0.9 : 0.5}
                        strokeLinecap="round"
                        strokeOpacity={active ? 0.65 : 1}
                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                    />
                )
            })}
        </svg>
    )
}

// ── Branch tree ───────────────────────────────────────────────────────────────

interface Props {
    branch:   SkillBranch
    allocs:   BuildAllocations
    onChange: (next: BuildAllocations) => void
}

export function BranchTree({ branch, allocs, onChange }: Props) {
    const meta   = BRANCH_META[branch]
    const nodes  = useMemo(() => getPlannedNodes(branch), [branch])
    const bpts   = useMemo(() => branchPoints(allocs, branch), [allocs, branch])

    return (
        <div className="flex flex-col gap-3">
            {/* Branch header */}
            <div className="px-1">
                <h2
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: meta.hex }}
                >
                    {meta.label}
                </h2>
                <p className="text-[11px] text-white/38 mt-0.5">{meta.tagline}</p>
                <div className="mt-1.5 flex items-center gap-2">
                    <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                            width: '100%',
                            background: `rgba(255,255,255,0.06)`,
                            position: 'relative',
                        }}
                    >
                        <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                            style={{
                                width:      `${Math.min(100, (bpts / 51) * 100)}%`,
                                background: meta.hex,
                                opacity:    0.7,
                            }}
                        />
                    </div>
                    <span
                        className="text-[10px] font-semibold tabular-nums shrink-0"
                        style={{ color: bpts > 0 ? meta.hex : 'rgba(255,255,255,0.25)' }}
                    >
                        {bpts} pts
                    </span>
                </div>
            </div>

            {/* Tree canvas */}
            <div
                className="relative w-full"
                style={{ aspectRatio: '3 / 4.5', maxWidth: 260, margin: '0 auto' }}
            >
                {/* SVG connector lines (behind nodes) */}
                <ConnectorLayer nodes={nodes} allocs={allocs} color={meta.hex} />

                {/* Point-gate rules */}
                <GateLine rowPct={ROW_PCT[3]} pts={bpts} required={15} color={meta.hex} />
                <GateLine rowPct={ROW_PCT[6]} pts={bpts} required={36} color={meta.hex} />

                {/* Skill nodes */}
                {nodes.map((node) => {
                    const state  = getNodeState(node, allocs, bpts)
                    const ranks  = allocs[node.uid] ?? 0

                    // Compute lock reason for tooltip
                    let lockReason: string | null = null
                    if (state === 'locked') {
                        const missingPrereqs = node.prerequisites
                            .filter((pid) => !((allocs[`${branch}_${pid}`] ?? 0) >= 1))
                        if (missingPrereqs.length > 0) {
                            lockReason = `Requires prerequisite skill`
                        }
                    }

                    const xPct = COL_PCT[node.col]
                    const yPct = ROW_PCT[node.row as 0|1|2|3|4|5|6]

                    return (
                        <div
                            key={node.uid}
                            className="absolute"
                            style={{
                                left:      `${xPct}%`,
                                top:       `${yPct}%`,
                                transform: 'translate(-50%, -50%)',
                                zIndex:    5,
                            }}
                        >
                            <SkillNodeBtn
                                node={node}
                                ranks={ranks}
                                state={state}
                                lockReason={lockReason}
                                onClick={() => onChange(cycleNode(allocs, node.uid))}
                                onRightClick={() => onChange(decrementNode(allocs, node.uid))}
                            />
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
