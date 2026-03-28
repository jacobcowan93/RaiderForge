'use client'

import type { SkillNode, SkillNodeState } from '@/data/skillTree'
import { BRANCH_META } from '@/data/skillTree'
import { useState } from 'react'

interface Props {
    node:    SkillNode
    ranks:   number           // currently allocated
    state:   SkillNodeState
    lockReason?: string | null
    onClick: () => void       // cycle +1 / deselect-all
    onRightClick?: () => void // decrement -1
}

/** Rank pip row — filled circles up to maxRanks. */
function RankPips({ ranks, maxRanks, color, locked }: {
    ranks:    number
    maxRanks: number
    color:    string
    locked:   boolean
}) {
    if (maxRanks <= 1) return null
    return (
        <div className="flex items-center justify-center gap-[3px] mt-1">
            {Array.from({ length: maxRanks }).map((_, i) => (
                <span
                    key={i}
                    className="rounded-full transition-all duration-150"
                    style={{
                        width:      5,
                        height:     5,
                        backgroundColor: i < ranks
                            ? (locked ? '#4b5563' : color)
                            : 'rgba(255,255,255,0.12)',
                        boxShadow: !locked && i < ranks ? `0 0 4px ${color}88` : 'none',
                    }}
                />
            ))}
        </div>
    )
}

export function SkillNodeBtn({ node, ranks, state, lockReason, onClick, onRightClick }: Props) {
    const [showTip, setShowTip] = useState(false)
    const meta    = BRANCH_META[node.branch]
    const isMajor = node.size === 'major'
    const locked  = state === 'locked'
    const maxed   = state === 'maxed'

    // ── Size ──────────────────────────────────────────────────────────────────
    const sz   = isMajor ? 56 : 44
    const rSz  = isMajor ? 8  : 6   // border-radius

    // ── Colors ────────────────────────────────────────────────────────────────
    let bgColor      = 'rgba(15,20,27,0.95)'
    let borderColor  = 'rgba(255,255,255,0.08)'
    let textColor    = 'rgba(255,255,255,0.28)'
    let glowColor    = 'transparent'
    let nameOpacity  = 0.28

    if (!locked && ranks === 0) {
        // available
        borderColor = `${meta.hex}40`
        textColor   = 'rgba(255,255,255,0.60)'
        nameOpacity = 0.6
    }
    if (ranks > 0 && !maxed) {
        // partial
        bgColor     = `${meta.hex}1a`
        borderColor = `${meta.hex}70`
        textColor   = 'rgba(255,255,255,0.88)'
        nameOpacity = 0.88
        glowColor   = `${meta.hex}25`
    }
    if (maxed) {
        bgColor     = `${meta.hex}30`
        borderColor = meta.hex
        textColor   = '#ffffff'
        nameOpacity = 1
        glowColor   = `${meta.hex}50`
    }

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault()
        onRightClick?.()
    }

    return (
        <div className="relative flex flex-col items-center" style={{ zIndex: showTip ? 50 : 'auto' }}>
            <button
                type="button"
                onClick={onClick}
                onContextMenu={handleRightClick}
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                onFocus={() => setShowTip(true)}
                onBlur={() => setShowTip(false)}
                disabled={locked}
                aria-label={`${node.name} (${ranks}/${node.maxRanks})`}
                className="relative flex flex-col items-center justify-center select-none transition-transform duration-100
                           disabled:cursor-not-allowed focus:outline-none"
                style={{
                    width:        sz,
                    height:       sz,
                    borderRadius: rSz,
                    background:   bgColor,
                    border:       `${isMajor ? 2 : 1.5}px solid ${borderColor}`,
                    boxShadow:    maxed || ranks > 0
                        ? `0 0 0 1px rgba(0,0,0,0.6), 0 0 12px ${glowColor}, 0 2px 6px rgba(0,0,0,0.7)`
                        : '0 0 0 1px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.6)',
                    transform: locked ? 'none' : undefined,
                }}
                onMouseDown={(e) => {
                    if (!locked && e.currentTarget) {
                        e.currentTarget.style.transform = 'scale(0.93)'
                    }
                }}
                onMouseUp={(e) => {
                    if (e.currentTarget) e.currentTarget.style.transform = 'scale(1)'
                }}
            >
                {/* Locked overlay */}
                {locked && (
                    <svg
                        className="absolute inset-0 m-auto"
                        width={14} height={14}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.20)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                )}

                {/* Rank number for multi-rank nodes */}
                {!locked && node.maxRanks > 1 && ranks > 0 && (
                    <span
                        className="text-[10px] font-bold leading-none tabular-nums"
                        style={{ color: textColor }}
                    >
                        {ranks}
                    </span>
                )}

                {/* Checkmark for fully unlocked single-rank nodes */}
                {!locked && node.maxRanks === 1 && ranks === 1 && (
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                         stroke={meta.hex} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                )}

                {/* Dot indicator for available single-rank nodes */}
                {!locked && node.maxRanks === 1 && ranks === 0 && (
                    <span className="block rounded-full w-2 h-2"
                          style={{ background: `${meta.hex}50` }} />
                )}
            </button>

            {/* Rank pips (below button) */}
            <RankPips ranks={ranks} maxRanks={node.maxRanks} color={meta.hex} locked={locked} />

            {/* Tooltip */}
            {showTip && (
                <div
                    className="absolute bottom-full mb-2 z-50 w-52 rounded-xl pointer-events-none"
                    style={{
                        background:   'rgba(7,9,13,0.97)',
                        border:       `1px solid ${locked ? 'rgba(255,255,255,0.08)' : borderColor}`,
                        boxShadow:    '0 8px 32px rgba(0,0,0,0.85)',
                        padding:      '10px 12px',
                    }}
                >
                    {/* Branch accent bar */}
                    <div
                        className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
                        style={{ background: locked ? 'rgba(255,255,255,0.08)' : meta.hex }}
                    />
                    <p className="text-[11px] font-bold text-white mb-1 leading-snug">{node.name}</p>
                    <p className="text-[10px] text-white/55 leading-relaxed mb-1">{node.description}</p>
                    {node.maxRanks > 1 && (
                        <p className="text-[10px] font-semibold" style={{ color: meta.hex }}>
                            {ranks}/{node.maxRanks} ranks
                        </p>
                    )}
                    {node.pointGate > 0 && locked && (
                        <p className="text-[10px] text-amber-400/80 mt-1">
                            Requires {node.pointGate} branch points
                        </p>
                    )}
                    {lockReason && locked && (
                        <p className="text-[10px] text-red-400/80 mt-0.5">{lockReason}</p>
                    )}
                    {!locked && node.maxRanks > 1 && (
                        <p className="text-[10px] text-white/30 mt-1">
                            Click +1 rank · Right-click −1
                        </p>
                    )}
                    {!locked && node.maxRanks === 1 && (
                        <p className="text-[10px] text-white/30 mt-1">
                            Click to {ranks === 1 ? 'deselect' : 'select'}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
