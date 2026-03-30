'use client'

import { memo } from 'react'
import { EXPEDITION_CAPS, type ExpeditionLevel } from '@/lib/skills/caps'

interface Props {
    spentTotal:         number
    maxPts:             number
    expeditionLevel:    ExpeditionLevel
    onExpeditionChange: (level: ExpeditionLevel) => void
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function BuildSidebarInner({ spentTotal, maxPts, expeditionLevel, onExpeditionChange }: Props) {
    const total     = spentTotal
    const globalCap = maxPts

    return (
        <aside>
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
                        const level  = i as ExpeditionLevel
                        const active = level === expeditionLevel
                        const labels = ['Base', 'Exp 1', 'Exp 2']
                        return (
                            <button
                                key={level}
                                type="button"
                                onClick={() => onExpeditionChange(level)}
                                className="flex-1 rounded-lg px-1.5 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors"
                                style={{
                                    background: active ? 'rgba(255,64,64,0.18)' : 'rgba(255,255,255,0.03)',
                                    border:     active ? '1px solid rgba(255,64,64,0.45)' : '1px solid rgba(255,255,255,0.08)',
                                    color:      active ? '#ff4040' : 'rgba(255,255,255,0.35)',
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
            </div>
        </aside>
    )
}

export const BuildSidebar = memo(BuildSidebarInner)
BuildSidebar.displayName = 'BuildSidebar'
