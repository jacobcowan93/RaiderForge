'use client'

import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { BRANCHES, BRANCH_META, TREE_EDGES } from '@/data/skillTree'
import type { SkillBranch } from '@/data/skillTree'
import {
    type BuildAllocations,
    type PlannedNode,
    type CapDenial,
    branchPoints,
    getNodeState,
    getPlannedNodes,
    cycleNode,
    decrementNode,
} from '@/lib/skills/planner'
import { SkillNodeBtn } from './SkillNodeBtn'

// ── Canvas geometry ───────────────────────────────────────────────────────────
// Logical pixel dimensions. Everything is expressed in these units then scaled
// to 100% wide via aspect-ratio CSS.  Ratio ≈ 1.636 : 1 matches the source art.

const W = 900
const H = 550

// ── Fan-layout node positions ─────────────────────────────────────────────────
// Computed mathematically to mirror the in-game layout:
//   • Conditioning leans 25° left of vertical
//   • Mobility goes straight up from centre
//   • Survival mirrors Conditioning (25° right)
//
// branch_up    = (-sinθ, -cosθ)       θ = lean angle from vertical
// branch_right = ( cosθ, -sinθ)       perpendicular (col 0→col 2)
// position(r, c) = root + r*ROW_STEP*up + (c-1)*COL_STEP*right
//
//   ROW_STEP = 65 px,  COL_STEP = 44 px,  rows 0-6,  cols 0/1/2

const NODE_XY: Record<string, [number, number]> = {
    // ── CONDITIONING  (origin 252,484 · θ=25° left) ─────────────────────────
    Conditioning_1:   [252, 484],

    Conditioning_2l:  [185, 444],
    Conditioning_2r:  [264, 407],

    Conditioning_3l:  [157, 385],
    Conditioning_3r:  [237, 348],

    Conditioning_4l:  [130, 326],
    Conditioning_4r:  [209, 289],

    Conditioning_5l:  [102, 267],
    Conditioning_5c:  [142, 248],
    Conditioning_5r:  [182, 230],

    Conditioning_6l:  [ 75, 208],
    Conditioning_6c:  [115, 190],
    Conditioning_6r:  [154, 171],

    Conditioning_7l:  [ 47, 149],
    Conditioning_7r:  [127, 112],

    // ── MOBILITY  (origin 450,484 · vertical) ────────────────────────────────
    Mobility_1:   [450, 484],

    Mobility_2l:  [400, 419],
    Mobility_2r:  [500, 419],

    Mobility_3l:  [400, 354],
    Mobility_3r:  [500, 354],

    Mobility_4l:  [400, 289],
    Mobility_4r:  [500, 289],

    Mobility_5l:  [400, 224],
    Mobility_5c:  [450, 224],
    Mobility_5r:  [500, 224],

    Mobility_6l:  [400, 159],
    Mobility_6c:  [450, 159],
    Mobility_6r:  [500, 159],

    Mobility_7l:  [400,  94],
    Mobility_7r:  [500,  94],

    // ── SURVIVAL  (origin 648,484 · θ=25° right, mirror of Conditioning) ────
    Survival_1:   [648, 484],

    Survival_2l:  [636, 407],
    Survival_2r:  [715, 444],

    Survival_3l:  [663, 348],
    Survival_3r:  [743, 385],

    Survival_4l:  [691, 289],
    Survival_4r:  [770, 326],

    Survival_5l:  [718, 230],
    Survival_5c:  [758, 248],
    Survival_5r:  [798, 267],

    Survival_6l:  [746, 171],
    Survival_6c:  [786, 190],
    Survival_6r:  [825, 208],

    Survival_7l:  [773, 112],
    Survival_7r:  [853, 149],
}

// All edges across every branch
const ALL_EDGES = BRANCHES.flatMap((b) =>
    TREE_EDGES.map(([f, t]) => [`${b}_${f}`, `${b}_${t}`] as [string, string])
)

// ── SVG connector layer ───────────────────────────────────────────────────────

function ConnectorLines({ allocs }: { allocs: BuildAllocations }) {
    return (
        <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            style={{ zIndex: 1 }}
            aria-hidden="true"
        >
            {ALL_EDGES.map(([fromUid, toUid]) => {
                const pos1 = NODE_XY[fromUid]
                const pos2 = NODE_XY[toUid]
                if (!pos1 || !pos2) return null

                const branch   = fromUid.split('_')[0] as SkillBranch
                const color    = BRANCH_META[branch].hex
                const active   = (allocs[fromUid] ?? 0) > 0 && (allocs[toUid] ?? 0) > 0

                return (
                    <line
                        key={`${fromUid}-${toUid}`}
                        x1={pos1[0]} y1={pos1[1]}
                        x2={pos2[0]} y2={pos2[1]}
                        stroke={active ? color : 'rgba(255,255,255,0.09)'}
                        strokeWidth={active ? 1.8 : 0.9}
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
                background:  'rgba(15,10,5,0.94)',
                border:      '1px solid rgba(251,191,36,0.40)',
                boxShadow:   '0 4px 24px rgba(0,0,0,0.8)',
                whiteSpace:  'nowrap',
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
    const [x, y] = NODE_XY[`${branch}_1`] ?? [0, 0]
    return (
        <div
            className="absolute pointer-events-none select-none text-center"
            style={{
                left:      `${(x / W) * 100}%`,
                top:       `${((y + 28) / H) * 100}%`,
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
}

export function UnifiedSkillTreeCanvas({ allocs, onChange }: Props) {
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
        const result = cycleNode(allocs, uid)
        if (result.denial) {
            if (denialRef.current) clearTimeout(denialRef.current)
            setDenial(result.denial)
            denialRef.current = setTimeout(() => setDenial(null), 2500)
        } else {
            if (denialRef.current) clearTimeout(denialRef.current)
            setDenial(null)
            onChange(result.allocs)
        }
    }, [allocs, onChange])

    return (
        <section
            aria-labelledby={headingId}
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: `${W} / ${H}` }}
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

            {/* Subtle grid / noise texture */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:  'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
                    backgroundSize:   '28px 28px',
                    borderRadius:     'inherit',
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
                const pos = NODE_XY[node.uid]
                if (!pos) return null

                const [x, y]   = pos
                const { bpts, nodeById } = branchData[node.branch]
                const state    = getNodeState(node, allocs, bpts)
                const ranks    = allocs[node.uid] ?? 0

                // Lock reason: list names of missing prerequisites
                let lockReason: string | null = null
                if (state === 'locked') {
                    const missing = node.prerequisites.filter(
                        (pid) => !((allocs[`${node.branch}_${pid}`] ?? 0) >= 1)
                    )
                    if (missing.length > 0) {
                        const names = missing
                            .map((pid) => nodeById.get(pid)?.name ?? pid)
                            .join(' & ')
                        lockReason = `Requires: ${names}`
                    }
                }

                const tooltipSide  = y > H * 0.72 ? 'above' : 'below'
                const tooltipAlign =
                    x < W * 0.22 ? 'left' :
                    x > W * 0.78 ? 'right' : 'center'

                return (
                    <div
                        key={node.uid}
                        className="absolute"
                        style={{
                            left:      `${(x / W) * 100}%`,
                            top:       `${(y / H) * 100}%`,
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
