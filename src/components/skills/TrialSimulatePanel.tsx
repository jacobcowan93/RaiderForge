'use client'

import Link from 'next/link'
import { memo, useId, useMemo, useState } from 'react'

import { getAllTrialsCatalog } from '@/data/trials'
import { BRANCH_META, BRANCHES } from '@/data/skillTree'
import { type BuildAllocations, branchPoints, totalPoints } from '@/lib/skills/planner'
import {
    getTrialIdealWeights,
    recommendAllocationsForTrial,
    scoreBuildAgainstTrial,
} from '@/lib/skills/trialBuildRecommendation'

/** Props for {@link TrialSimulatePanel} — current build, expedition cap, and apply handler. */
export interface TrialSimulatePanelProps {
    allocs: BuildAllocations
    maxPts: number
    onApply: (newAllocs: BuildAllocations) => void
}

/**
 * Collapsible panel: trial synergy score, ideal mix, recommended allocations, apply with confirm.
 * Memoised so parent sidebar re-renders do not re-run catalog sorting unnecessarily.
 */
function TrialSimulatePanelInner({ allocs, maxPts, onApply }: TrialSimulatePanelProps) {
    const panelBodyId = useId()
    const trials = useMemo(
        () => [...getAllTrialsCatalog()].sort((a, b) => a.name.localeCompare(b.name)),
        [],
    )
    const [open, setOpen] = useState(false)
    const [trialId, setTrialId] = useState(() => trials[0]?.id ?? '')

    const trial = trials.find((t) => t.id === trialId) ?? trials[0]

    const synergy = useMemo(() => {
        if (!trial) return null
        return scoreBuildAgainstTrial(allocs, trial)
    }, [allocs, trial])

    const recommended = useMemo(() => {
        if (!trial || maxPts <= 0) return null
        return recommendAllocationsForTrial(trial, maxPts)
    }, [trial, maxPts])

    const ideal = trial ? getTrialIdealWeights(trial.id) : null

    const applyRecommended = () => {
        if (!recommended) return
        const ok = window.confirm('Replace current build with trial recommendation?')
        if (!ok) return
        onApply(recommended)
    }

    if (trials.length === 0) return null

    return (
        <div
            className="rounded-xl border border-white/[0.07] overflow-hidden"
            style={{ background: 'rgba(15,20,27,0.65)' }}
        >
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelBodyId}
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
            >
                {/* Header mirrors Import panel (BuildSidebar) for visual consistency */}
                <div className="flex items-center gap-2">
                    <svg
                        width={12}
                        height={12}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.35)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                    >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                    </svg>
                    <span className="text-[11px] font-semibold text-white/40">Simulate for Trial</span>
                </div>
                <svg
                    className="transition-transform duration-200"
                    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
                    width={11}
                    height={11}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && trial && (
                <div
                    id={panelBodyId}
                    role="region"
                    aria-label="Trial simulation and recommended point spread"
                    className="px-3 pb-3 flex flex-col gap-3 border-t border-white/[0.05]"
                >
                    <p className="text-[10px] text-white/30 leading-relaxed pt-2">
                        Pick a trial from the catalog. We score your current build against that trial&apos;s focus and
                        suggest a point spread (client-side heuristic).
                    </p>

                    <label className="block">
                        <span className="text-[9px] uppercase tracking-widest text-white/25 font-semibold">Trial</span>
                        <select
                            value={trial.id}
                            onChange={(e) => setTrialId(e.target.value)}
                            title="Choose a trial to get recommended point allocation"
                            aria-label="Select weekly trial for synergy scoring"
                            className="mt-1 w-full rounded-lg border border-white/[0.1] bg-[#0a0d14] px-2.5 py-2 text-[11px] text-white/80
                                       focus:outline-none focus:border-white/25 min-h-[44px]"
                        >
                            {trials.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {synergy && (
                        <div
                            className="rounded-lg border px-2.5 py-2"
                            style={{
                                borderColor: 'rgba(56,189,248,0.22)',
                                background: 'rgba(56,189,248,0.06)',
                            }}
                        >
                            <p className="text-[10px] font-bold text-sky-200/95 leading-snug">{synergy.label}</p>
                            <p className="text-[9px] text-white/40 mt-1 tabular-nums">
                                Compatibility score:{' '}
                                <span className="text-white/70 font-semibold">{synergy.score}</span>/100
                            </p>
                        </div>
                    )}

                    {ideal && (
                        <div className="text-[9px] text-white/35">
                            <span className="uppercase tracking-wider text-white/25 font-semibold">Ideal focus</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                                {BRANCHES.map((b) => {
                                    const k =
                                        b === 'Conditioning'
                                            ? 'conditioning'
                                            : b === 'Mobility'
                                              ? 'mobility'
                                              : 'survival'
                                    return (
                                        <span key={b} style={{ color: BRANCH_META[b].hex }}>
                                            {BRANCH_META[b].label}: {Math.round(ideal[k] * 100)}%
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {recommended && (
                        <>
                            <div className="text-[9px] text-white/35">
                                <span className="uppercase tracking-wider text-white/25 font-semibold">
                                    Recommended branch totals ({totalPoints(recommended)} pts)
                                </span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {BRANCHES.map((b) => (
                                        <span key={b} style={{ color: BRANCH_META[b].hex }}>
                                            {BRANCH_META[b].label}: {branchPoints(recommended, b)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={applyRecommended}
                                aria-label="Apply recommended expedition points to current build"
                                className="w-full rounded-lg border border-rf-red/45 bg-rf-red/15 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-rf-red
                                           hover:bg-rf-red/25 transition-colors min-h-[44px]"
                            >
                                Apply recommended points
                            </button>
                        </>
                    )}

                    <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.05]">
                        <Link
                            href="/trials"
                            className="text-[10px] font-semibold text-sky-400/90 hover:underline underline-offset-2"
                        >
                            View all Trials →
                        </Link>
                        <p className="text-[9px] text-white/25 leading-relaxed">
                            Scoring is a client-side heuristic only.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export const TrialSimulatePanel = memo(TrialSimulatePanelInner)
TrialSimulatePanel.displayName = 'TrialSimulatePanel'
