'use client'

import { useCallback, useId, useMemo, useRef, useState } from 'react'
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
//   Columns (% of container width):  col 0 → 16.7%  col 1 → 50%  col 2 → 83.3%
//   Rows    (% of container height): row 0 →  7%    row 6 → 91%  (14% spacing)

const COL_PCT = [16.7, 50, 83.3] as const
const ROW_PCT = [7, 21, 35, 49, 63, 77, 91] as const

// ── Gate indicator ────────────────────────────────────────────────────────────

interface GateLineProps {
    rowPct:   number
    pts:      number
    required: number
    color:    string
}

function GateLine({ rowPct, pts, required, color }: GateLineProps) {
    const met = pts >= required
    return (
        <div
            className="absolute left-[5%] right-[5%] flex items-center gap-2 pointer-events-none"
            style={{ top: `calc(${rowPct}% - 28px)`, zIndex: 3 }}
            aria-hidden="true"
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
            aria-hidden="true"
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

// ── Node detail strip ─────────────────────────────────────────────────────────
// Rendered below the canvas; shows name + description of the hovered/focused
// node without requiring a tooltip.  min-h prevents layout jump on clear.

interface DetailStripProps {
    node:  PlannedNode | null
    ranks: number
    hex:   string
}

function NodeDetailStrip({ node, ranks, hex }: DetailStripProps) {
    return (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="rounded-xl border px-3 py-2.5 transition-colors duration-150"
            style={{
                minHeight:   56,
                background:  'rgba(11,14,20,0.75)',
                borderColor: node ? `${hex}28` : 'rgba(255,255,255,0.05)',
            }}
        >
            {node ? (
                <>
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                        <span
                            className="text-[11px] font-bold leading-snug"
                            style={{ color: hex }}
                        >
                            {node.name}
                        </span>
                        {node.maxRanks > 1 && (
                            <span
                                className="text-[9px] font-semibold tabular-nums"
                                style={{ color: `${hex}99` }}
                            >
                                {ranks}/{node.maxRanks}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed">
                        {node.description}
                    </p>
                </>
            ) : (
                <p className="text-[10px] text-white/20 italic leading-snug pt-1">
                    Hover or focus a skill to see its description
                </p>
            )}
        </div>
    )
}

// ── Branch tree ───────────────────────────────────────────────────────────────

interface Props {
    branch:   SkillBranch
    allocs:   BuildAllocations
    onChange: (next: BuildAllocations) => void
}

export function BranchTree({ branch, allocs, onChange }: Props) {
    const meta      = BRANCH_META[branch]
    const nodes     = useMemo(() => getPlannedNodes(branch), [branch])
    const bpts      = useMemo(() => branchPoints(allocs, branch), [allocs, branch])
    const headingId = useId()

    // Fast id → node lookup for lock reason text
    const nodeById = useMemo(() => {
        const m = new Map<string, PlannedNode>()
        for (const n of nodes) m.set(n.id, n)
        return m
    }, [nodes])

    // Active node — tracks hover/focus for the detail strip.
    // Debounced clear prevents flicker when moving between adjacent nodes.
    const [activeNode, setActiveNode] = useState<PlannedNode | null>(null)
    const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleActivate = useCallback((node: PlannedNode, active: boolean) => {
        if (active) {
            if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
            setActiveNode(node)
        } else {
            clearTimerRef.current = setTimeout(() => setActiveNode(null), 150)
        }
    }, [])

    return (
        <div
            role="group"
            aria-labelledby={headingId}
            className="flex flex-col gap-3"
        >
            {/* Branch header */}
            <div className="px-1">
                <h2
                    id={headingId}
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: meta.hex }}
                >
                    {meta.label}
                </h2>
                <p className="text-[11px] text-white/38 mt-0.5">{meta.tagline}</p>
                <div className="mt-1.5 flex items-center gap-2">
                    <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', position: 'relative' }}
                        role="progressbar"
                        aria-label={`${meta.label} points`}
                        aria-valuenow={bpts}
                        aria-valuemin={0}
                        aria-valuemax={51}
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
                        aria-hidden="true"
                    >
                        {bpts} pts
                    </span>
                </div>
            </div>

            {/* Tree canvas */}
            <div
                className="relative w-full"
                style={{ aspectRatio: '1 / 2.2', maxWidth: 280, margin: '0 auto' }}
            >
                {/* SVG connector lines (behind nodes) */}
                <ConnectorLayer nodes={nodes} allocs={allocs} color={meta.hex} />

                {/* Point-gate rules */}
                <GateLine rowPct={ROW_PCT[3]} pts={bpts} required={15} color={meta.hex} />
                <GateLine rowPct={ROW_PCT[6]} pts={bpts} required={36} color={meta.hex} />

                {/* Skill nodes */}
                {nodes.map((node) => {
                    const state = getNodeState(node, allocs, bpts)
                    const ranks = allocs[node.uid] ?? 0

                    // Compute lock reason — list specific missing prerequisite names
                    let lockReason: string | null = null
                    if (state === 'locked') {
                        const missingPrereqs = node.prerequisites
                            .filter((pid) => !((allocs[`${branch}_${pid}`] ?? 0) >= 1))
                        if (missingPrereqs.length > 0) {
                            const names = missingPrereqs
                                .map((pid) => nodeById.get(pid)?.name ?? pid)
                                .join(' & ')
                            lockReason = `Requires: ${names}`
                        }
                    }

                    // Tooltip alignment: keep edge-column tooltips inside the canvas
                    const tooltipAlign =
                        node.col === 0 ? 'left' :
                        node.col === 2 ? 'right' : 'center'

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
                                onDecrement={() => onChange(decrementNode(allocs, node.uid))}
                                tooltipSide={node.row === 0 ? 'below' : 'above'}
                                tooltipAlign={tooltipAlign}
                                onActivate={(active) => handleActivate(node, active)}
                            />
                        </div>
                    )
                })}
            </div>

            {/* Node detail strip — non-hover description path */}
            <NodeDetailStrip
                node={activeNode}
                ranks={activeNode ? (allocs[activeNode.uid] ?? 0) : 0}
                hex={meta.hex}
            />
        </div>
    )
}
