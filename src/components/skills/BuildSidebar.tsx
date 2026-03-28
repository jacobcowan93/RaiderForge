'use client'

import { useMemo, useState } from 'react'
import type { SkillBranch } from '@/data/skillTree'
import { BRANCH_META, BRANCHES } from '@/data/skillTree'
import {
    type BuildAllocations,
    type BuildSummaryRow,
    buildSummary,
    totalPoints,
    resetAll,
    resetBranch,
    encodeBuildToUrl,
} from '@/lib/skills/planner'

interface Props {
    allocs:   BuildAllocations
    onChange: (next: BuildAllocations) => void
}

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
                <ul className="pb-2 px-3 space-y-1">
                    {row.selected.map((s) => (
                        <li key={s.uid} className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/55 truncate">{s.name}</span>
                            <span className="text-[10px] font-semibold tabular-nums shrink-0"
                                  style={{ color: `${meta.hex}cc` }}>
                                {s.maxRanks > 1 ? `${s.ranks}/${s.maxRanks}` : '✓'}
                            </span>
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

export function BuildSidebar({ allocs, onChange }: Props) {
    const [copied, setCopied] = useState(false)
    const summary = useMemo(() => buildSummary(allocs), [allocs])
    const total   = useMemo(() => totalPoints(allocs), [allocs])

    const handleShare = async () => {
        const encoded = encodeBuildToUrl(allocs)
        const url = `${window.location.origin}${window.location.pathname}${encoded ? `?b=${encoded}` : ''}`
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            /* fallback: select + manual copy not needed for MVP */
        }
    }

    const handleResetBranch = (branch: SkillBranch) => {
        onChange(resetBranch(allocs, branch))
    }

    return (
        <aside className="flex flex-col gap-4">
            {/* Total points */}
            <div
                className="rounded-2xl border border-white/[0.07] px-5 py-4"
                style={{ background: 'rgba(15,20,27,0.7)' }}
            >
                <p className="text-[10px] uppercase tracking-widest text-white/35 font-semibold mb-1">
                    Total Points Spent
                </p>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold tabular-nums text-white">{total}</span>
                    <span className="text-sm text-white/30 mb-1 font-medium">expedition pts</span>
                </div>

                {/* Per-branch dots */}
                <div className="mt-3 flex items-center gap-3">
                    {BRANCHES.map((b) => {
                        const row  = summary.find((r) => r.branch === b)!
                        const meta = BRANCH_META[b]
                        return (
                            <div key={b} className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ background: meta.hex, opacity: 0.75 }} />
                                <span className="text-[10px] tabular-nums font-semibold"
                                      style={{ color: row.spent > 0 ? meta.hex : 'rgba(255,255,255,0.25)' }}>
                                    {row.spent}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Branch breakdowns */}
            <div className="space-y-2">
                {summary.map((row) => (
                    <BranchRow key={row.branch} row={row} />
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold
                               border border-rf-red/30 bg-rf-red/10 text-rf-red
                               hover:bg-rf-red/18 hover:border-rf-red/50 transition-colors"
                >
                    {copied ? (
                        <>
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Link copied!
                        </>
                    ) : (
                        <>
                            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            Copy share link
                        </>
                    )}
                </button>

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
                        const hasPoints = summary.find((r) => r.branch === b)!.spent > 0
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
