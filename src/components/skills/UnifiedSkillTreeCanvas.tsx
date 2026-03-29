'use client'

import { memo, useCallback, useId, useMemo, useRef, useState } from 'react'
import { BRANCHES, BRANCH_META } from '@/data/skillTree'
import type { SkillBranch } from '@/data/skillTree'
import {
    type BuildAllocations,
    type PlannedNode,
    type CapDenial,
    branchPoints,
    getNodeState,
    getPlannedNodes,
    getRanks,
    cycleNode,
    decrementNode,
} from '@/lib/skills/planner'
import {
    CANVAS_W,
    CANVAS_H,
    NODE_LAYOUT_MAP,
    CONNECTORS,
} from '@/data/skillTreeLayout'
import { SkillNodeBtn } from './SkillNodeBtn'

// ── SVG connector layer ───────────────────────────────────────────────────────

function ConnectorLines({ allocs }: { allocs: BuildAllocations }) {
    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            preserveAspectRatio="none"
            style={{ zIndex: 1 }}
            aria-hidden="true"
        >
            {CONNECTORS.map(({ from: fromUid, to: toUid }) => {
                const pos1 = NODE_LAYOUT_MAP.get(fromUid)
                const pos2 = NODE_LAYOUT_MAP.get(toUid)
                if (!pos1 || !pos2) return null

                const branch        = fromUid.split('_')[0] as SkillBranch
                const color         = BRANCH_META[branch].hex
                const fromAllocated = getRanks(allocs, fromUid) > 0
                const toAllocated   = getRanks(allocs, toUid) > 0
                // active = both ends allocated (full bright)
                // available = source allocated, destination not yet (dim branch color)
                const active    = fromAllocated && toAllocated
                const available = fromAllocated && !toAllocated

                return (
                    <line
                        key={`${fromUid}-${toUid}`}
                        x1={pos1.x} y1={pos1.y}
                        x2={pos2.x} y2={pos2.y}
                        stroke={active ? color : available ? `${color}55` : 'rgba(255,255,255,0.09)'}
                        strokeWidth={active ? 1.8 : available ? 1.3 : 0.9}
                        strokeLinecap="round"
                        strokeOpacity={active ? 0.65 : 1}
                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                    />
                )
            })}
        </svg>
    )
}

// ── Cap denial toast ──────────────────────────────────────────────────────────

function DenialToast({ denial }: { denial: CapDenial | null }) {
    if (!denial) return null
    return (
        <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50
                       flex items-center gap-2 rounded-xl px-4 py-2.5
                       text-[11px] font-semibold text-amber-300 pointer-events-none"
            style={{
                background: 'rgba(15,10,5,0.94)',
                border:     '1px solid rgba(251,191,36,0.40)',
                boxShadow:  '0 4px 24px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
            }}
            aria-live="assertive"
            aria-atomic="true"
        >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none"
                 stroke="rgb(251,191,36)" strokeWidth={2}
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {denial.message}
        </div>
    )
}

// ── Branch label ──────────────────────────────────────────────────────────────

function BranchLabel({ branch, bpts }: { branch: SkillBranch; bpts: number }) {
    const meta   = BRANCH_META[branch]
    const layout = NODE_LAYOUT_MAP.get(`${branch}_1`)
    if (!layout) return null
    const { x, y } = layout
    return (
        <div
            className="absolute pointer-events-none select-none text-center"
            style={{
                left:      `${(x / CANVAS_W) * 100}%`,
                top:       `${((y + 28) / CANVAS_H) * 100}%`,
                transform: 'translateX(-50%)',
                zIndex:    4,
            }}
        >
            <div
                className="text-[8px] font-bold uppercase tracking-[0.12em]"
                style={{ color: meta.hex, opacity: 0.75 }}
            >
                {meta.label}
            </div>
            <div
                className="text-[13px] font-bold tabular-nums leading-tight"
                style={{ color: bpts > 0 ? meta.hex : 'rgba(255,255,255,0.28)' }}
            >
                {bpts}
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
    allocs:   BuildAllocations
    onChange: (next: BuildAllocations) => void
    maxPts?:  number
}

function UnifiedSkillTreeCanvasInner({ allocs, onChange, maxPts }: Props) {
    const headingId = useId()

    // Per-branch point totals + node lists (memoised on allocs)
    const branchData = useMemo(() => {
        const out = {} as Record<SkillBranch, {
            nodes:    PlannedNode[]
            bpts:     number
            nodeById: Map<string, PlannedNode>
        }>
        for (const b of BRANCHES) {
            const nodes = getPlannedNodes(b)
            out[b] = {
                nodes,
                bpts:     branchPoints(allocs, b),
                nodeById: new Map(nodes.map((n) => [n.id, n])),
            }
        }
        return out
    }, [allocs])

    const allNodes = useMemo(
        () => BRANCHES.flatMap((b) => branchData[b].nodes),
        [branchData]
    )

    // Cap denial feedback (auto-clears after 2.5 s)
    const [denial, setDenial]   = useState<CapDenial | null>(null)
    const denialRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleClick = useCallback((uid: string) => {
        const result = cycleNode(allocs, uid, maxPts)
        if (result.denial) {
            if (denialRef.current) clearTimeout(denialRef.current)
            setDenial(result.denial)
            denialRef.current = setTimeout(() => setDenial(null), 2500)
        } else {
            if (denialRef.current) clearTimeout(denialRef.current)
            setDenial(null)
            onChange(result.allocs)
        }
    }, [allocs, onChange, maxPts])

    return (
        <section
            aria-labelledby={headingId}
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        >
            <h2 id={headingId} className="sr-only">Skill tree — all branches</h2>

            {/* Dark canvas background */}
            <div
                className="absolute inset-0"
                style={{
                    background:   'radial-gradient(ellipse at 50% 110%, rgba(20,28,40,0.95) 0%, rgba(8,10,16,0.98) 65%)',
                    borderRadius: 'inherit',
                }}
            />

            {/* Subtle dot-grid texture */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
                    backgroundSize:  '28px 28px',
                    borderRadius:    'inherit',
                }}
            />

            {/* SVG connector lines */}
            <ConnectorLines allocs={allocs} />

            {/* Branch labels (below each root node) */}
            {BRANCHES.map((b) => (
                <BranchLabel key={b} branch={b} bpts={branchData[b].bpts} />
            ))}

            {/* Skill nodes */}
            {allNodes.map((node) => {
                const layout = NODE_LAYOUT_MAP.get(node.uid)
                if (!layout) return null

                const { x, y, tooltipSide, tooltipAlign } = layout
                const { bpts, nodeById } = branchData[node.branch]
                const state  = getNodeState(node, allocs, bpts)
                const ranks  = getRanks(allocs, node.uid)

                // Lock reason: list names of missing prerequisites
                let lockReason: string | null = null
                if (state === 'locked') {
                    const missing = node.prerequisites.filter(
                        (pid) => getRanks(allocs, `${node.branch}_${pid}`) < 1
                    )
                    if (missing.length > 0) {
                        const names = missing
                            .map((pid) => nodeById.get(pid)?.name ?? pid)
                            .join(' & ')
                        lockReason = `Requires: ${names}`
                    }
                }

                return (
                    <div
                        key={node.uid}
                        className="absolute"
                        style={{
                            left:      `${(x / CANVAS_W) * 100}%`,
                            top:       `${(y / CANVAS_H) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex:    5,
                        }}
                    >
                        <SkillNodeBtn
                            node={node}
                            ranks={ranks}
                            state={state}
                            lockReason={lockReason}
                            onClick={() => handleClick(node.uid)}
                            onDecrement={() => onChange(decrementNode(allocs, node.uid))}
                            tooltipSide={tooltipSide}
                            tooltipAlign={tooltipAlign}
                        />
                    </div>
                )
            })}

            {/* Cap denial toast */}
            <DenialToast denial={denial} />
        </section>
    )
}

export const UnifiedSkillTreeCanvas = memo(UnifiedSkillTreeCanvasInner)
UnifiedSkillTreeCanvas.displayName = 'UnifiedSkillTreeCanvas'
