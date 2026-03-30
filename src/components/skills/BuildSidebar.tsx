'use client'

import { memo, useMemo, useState } from 'react'
import type { SkillBranch } from '@/data/skillTree'
import { BRANCH_META, BRANCHES } from '@/data/skillTree'
import {
    type BuildAllocations,
    type BuildSummaryRow,
    buildSummary,
    resetAll,
    resetBranch,
} from '@/lib/skills/planner'
import { EXPEDITION_CAPS, type ExpeditionLevel } from '@/lib/skills/caps'

interface Props {
    allocs:             BuildAllocations
    /** From {@link totalPoints} — parent-computed so header matches tree. */
    spentTotal:         number
    /** From {@link branchPoints} per branch — parent-computed. */
    branchSpent:        Record<SkillBranch, number>
    onChange:           (next: BuildAllocations) => void
    maxPts:             number
    expeditionLevel:    ExpeditionLevel
    onExpeditionChange: (level: ExpeditionLevel) => void
}

// ── Branch breakdown row ───────────────────────────────────────────────────────

function BranchRow({ row }: { row: BuildSummaryRow }) {
    const [open, setOpen] = useState(false)
    const meta = BRANCH_META[row.branch]

    return (
        <div className="rounded-xl overflow-hidden border border-white/[0.06]"
             style={{ background: 'rgba(15,20,27,0.6)' }}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: meta.hex }}>
                        {meta.label}
                    </span>
                    {row.selected.length > 0 && (
                        <span
                            className="text-[9px] font-bold rounded-full px-1.5 py-0.5 border"
                            style={{
                                color:            meta.hex,
                                borderColor:      `${meta.hex}40`,
                                backgroundColor:  `${meta.hex}15`,
                            }}
                        >
                            {row.selected.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold tabular-nums"
                          style={{ color: row.spent > 0 ? meta.hex : 'rgba(255,255,255,0.25)' }}>
                        {row.spent} pts
                    </span>
                    <svg
                        className="transition-transform duration-200"
                        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
                        width={12} height={12} viewBox="0 0 24 24" fill="none"
                        stroke="rgba(255,255,255,0.30)" strokeWidth={2.5}
                        strokeLinecap="round" strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </div>
            </button>

            {/* Progress bar */}
            <div className="mx-3 mb-2 h-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                        width:      `${Math.min(100, (row.spent / row.maxPossible) * 100)}%`,
                        background: meta.hex,
                        opacity:    0.55,
                    }}
                />
            </div>

            {/* Expanded selected skills list */}
            {open && row.selected.length > 0 && (
                <ul className="pb-2 px-3 space-y-2">
                    {row.selected.map((s) => (
                        <li key={s.uid} className="border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold text-white/70 truncate">{s.name}</span>
                                <span className="text-[10px] font-bold tabular-nums shrink-0"
                                      style={{ color: `${meta.hex}cc` }}>
                                    {s.maxRanks > 1 ? `${s.ranks}/${s.maxRanks}` : '✓'}
                                </span>
                            </div>
                            <p className="text-[9px] text-white/35 leading-relaxed mt-0.5">
                                {s.description}
                            </p>
                        </li>
                    ))}
                </ul>
            )}

            {open && row.selected.length === 0 && (
                <p className="pb-2 px-3 text-[10px] text-white/25">No skills selected</p>
            )}
        </div>
    )
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function BuildSidebarInner({ allocs, spentTotal, branchSpent, onChange, maxPts, expeditionLevel, onExpeditionChange }: Props) {
    const summary   = useMemo(() => buildSummary(allocs), [allocs])
    const total     = spentTotal
    const globalCap = maxPts

    const handleResetBranch = (branch: SkillBranch) => {
        onChange(resetBranch(allocs, branch))
    }

    return (
        <aside className="flex flex-col gap-4">
            {/* Total points + expedition tier */}
            <div
                className="rounded-2xl border border-white/[0.07] px-5 py-4"
                style={{ background: 'rgba(15,20,27,0.7)' }}
            >
                {/* Available / spent header */}
                <p className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-1">
                    Available Points
                </p>
                <div className="flex items-end gap-2 mb-3">
                    <span
                        className="text-4xl font-bold tabular-nums"
                        style={{ color: globalCap !== null && total >= globalCap ? '#f59e0b' : 'white' }}
                    >
                        {total}
                    </span>
                    <span className="text-xl font-semibold tabular-nums text-white/25 mb-0.5">
                        / {maxPts}
                    </span>
                    <span className="text-sm text-white/30 mb-1 font-medium">pts</span>
                </div>

                {/* Progress bar */}
                <div className="mb-3 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                            width:      `${Math.min(100, (total / maxPts) * 100)}%`,
                            background: total >= maxPts ? '#f59e0b' : '#ff4040',
                            opacity:    0.75,
                        }}
                    />
                </div>

                {total >= maxPts && (
                    <p className="text-[9px] text-amber-400/75 mb-2 font-semibold uppercase tracking-wide">
                        Point cap reached
                    </p>
                )}

                {/* Expedition tier selector */}
                <p className="text-[9px] uppercase tracking-widest text-white/25 font-semibold mb-1.5">
                    Expedition tier
                </p>
                <div className="flex gap-1">
                    {EXPEDITION_CAPS.map((cap, i) => {
                        const level = i as ExpeditionLevel
                        const active = level === expeditionLevel
                        const labels = ['Base', 'Exp 1', 'Exp 2']
                        return (
                            <button
                                key={level}
                                type="button"
                                onClick={() => onExpeditionChange(level)}
                                className="flex-1 rounded-lg px-1.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors"
                                style={{
                                    background:   active ? 'rgba(255,64,64,0.18)' : 'rgba(255,255,255,0.03)',
                                    border:       active ? '1px solid rgba(255,64,64,0.45)' : '1px solid rgba(255,255,255,0.08)',
                                    color:        active ? '#ff4040' : 'rgba(255,255,255,0.35)',
                                }}
                                title={`${cap} total points`}
                            >
                                <span className="block">{labels[i]}</span>
                                <span
                                    className="block text-[8px] font-semibold tabular-nums"
                                    style={{ color: active ? 'rgba(255,64,64,0.75)' : 'rgba(255,255,255,0.20)' }}
                                >
                                    {cap} pts
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Per-branch dots */}
                <div className="mt-3 flex items-center gap-3">
                    {BRANCHES.map((b) => {
                        const pts  = branchSpent[b]
                        const meta = BRANCH_META[b]
                        return (
                            <div key={b} className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ background: meta.hex, opacity: 0.75 }} />
                                <span className="text-[10px] tabular-nums font-semibold"
                                      style={{ color: pts > 0 ? meta.hex : 'rgba(255,255,255,0.25)' }}>
                                    {pts}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Branch breakdowns */}
            <div className="space-y-2">
                {summary.map((row) => (
                    <BranchRow
                        key={row.branch}
                        row={{ ...row, spent: branchSpent[row.branch] }}
                    />
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
                {/* Reset all */}
                <button
                    type="button"
                    onClick={() => onChange(resetAll())}
                    disabled={total === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold
                               border border-white/10 bg-white/[0.03] text-white/45
                               hover:border-white/20 hover:text-white/65 transition-colors
                               disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 .49-3.58"/>
                    </svg>
                    Reset all
                </button>

                {/* Per-branch resets */}
                <div className="flex items-center gap-1.5">
                    {BRANCHES.map((b) => {
                        const meta = BRANCH_META[b]
                        const hasPoints = branchSpent[b] > 0
                        return (
                            <button
                                key={b}
                                type="button"
                                onClick={() => handleResetBranch(b)}
                                disabled={!hasPoints}
                                className="flex-1 text-[9px] font-semibold uppercase tracking-wider
                                           rounded-lg border px-1.5 py-1.5 transition-colors
                                           disabled:opacity-25 disabled:cursor-not-allowed"
                                style={{
                                    color:           meta.hex,
                                    borderColor:     hasPoints ? `${meta.hex}35` : 'rgba(255,255,255,0.06)',
                                    backgroundColor: hasPoints ? `${meta.hex}10` : 'transparent',
                                }}
                                title={`Reset ${meta.label}`}
                            >
                                {meta.label.slice(0, 4)}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Attribution */}
            <p className="text-[9px] text-white/18 leading-relaxed">
                Skill data sourced from{' '}
                <a
                    href="https://metaforge.app/arc-raiders/skill-builder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-white/35 transition-colors"
                >
                    MetaForge
                </a>
                . No official API available; data may change with game updates.
            </p>
        </aside>
    )
}

export const BuildSidebar = memo(BuildSidebarInner)
BuildSidebar.displayName = 'BuildSidebar'
