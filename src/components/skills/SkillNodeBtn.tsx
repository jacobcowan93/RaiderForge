'use client'

import type { SkillNode, SkillNodeState } from '@/data/skillTree'
import { BRANCH_META } from '@/data/skillTree'
import { useId, useRef, useState } from 'react'

// ── Rank pips ─────────────────────────────────────────────────────────────────

function RankPips({ ranks, maxRanks, color, locked }: {
    ranks:    number
    maxRanks: number
    color:    string
    locked:   boolean
}) {
    if (maxRanks <= 1) return null
    return (
        <div className="flex items-center justify-center gap-[3px] mt-[3px]">
            {Array.from({ length: maxRanks }).map((_, i) => (
                <span
                    key={i}
                    className="rounded-full block flex-shrink-0 transition-all duration-150"
                    style={{
                        width:           3,
                        height:          3,
                        backgroundColor: i < ranks
                            ? (locked ? '#374151' : color)
                            : 'rgba(255,255,255,0.10)',
                        boxShadow: !locked && i < ranks ? `0 0 3px ${color}99` : 'none',
                    }}
                />
            ))}
        </div>
    )
}

// ── Node label ────────────────────────────────────────────────────────────────
// Always-visible compact name below the node button.  Dark text-shadow keeps
// it legible over the SVG connector lines.

function NodeLabel({ name, color, locked }: { name: string; color: string; locked: boolean }) {
    return (
        <span
            aria-hidden="true"           // button's aria-label already carries the name
            className="block text-center overflow-hidden whitespace-nowrap pointer-events-none select-none"
            style={{
                fontSize:     '7.5px',
                fontWeight:   600,
                lineHeight:   1.2,
                maxWidth:     72,
                color:        locked ? 'rgba(255,255,255,0.22)' : color,
                textShadow:   '0 1px 4px rgba(0,0,0,0.95), 0 0 6px rgba(0,0,0,0.9)',
                textOverflow: 'ellipsis',
                marginTop:    '3px',
                letterSpacing:'0.01em',
                transition:   'color 0.2s',
            }}
        >
            {name}
        </span>
    )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
    node:          SkillNode
    ranks:         number
    state:         SkillNodeState
    lockReason?:   string | null
    onClick:       () => void
    onDecrement?:  () => void                              // keyboard −1 / right-click
    tooltipSide?:  'above' | 'below'                      // flip for root node (row 0)
    tooltipAlign?: 'left' | 'center' | 'right'            // clamp for edge columns
    onActivate?:   (active: boolean) => void              // hover/focus notification
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SkillNodeBtn({
    node,
    ranks,
    state,
    lockReason,
    onClick,
    onDecrement,
    tooltipSide   = 'above',
    tooltipAlign  = 'center',
    onActivate,
}: Props) {
    const [showTip,    setShowTip]    = useState(false)
    const [kbFocused,  setKbFocused]  = useState(false)   // keyboard-only focus ring
    const tipId     = useId()
    const meta      = BRANCH_META[node.branch]
    const isMajor   = node.size === 'major'
    const locked    = state === 'locked'
    const maxed     = state === 'maxed'

    // Track whether focus arrived via pointer so we can suppress the ring
    // on mouse click (only show it for keyboard navigation).
    const pointerRef = useRef(false)

    // ── Sizes ─────────────────────────────────────────────────────────────────
    const sz  = isMajor ? 54 : 42
    const rSz = isMajor ?  7 :  5

    // ── Colors by state ───────────────────────────────────────────────────────
    let bgColor      = 'rgba(12,16,22,0.97)'
    let borderColor  = 'rgba(255,255,255,0.07)'
    let glowColor    = 'transparent'
    let contentColor = 'rgba(255,255,255,0.22)'

    if (!locked && ranks === 0) {
        borderColor  = `${meta.hex}38`
        contentColor = `${meta.hex}88`
    }
    if (ranks > 0 && !maxed) {
        bgColor      = `${meta.hex}18`
        borderColor  = `${meta.hex}65`
        glowColor    = `${meta.hex}22`
        contentColor = meta.hex
    }
    if (maxed) {
        bgColor      = `${meta.hex}28`
        borderColor  = meta.hex
        glowColor    = `${meta.hex}48`
        contentColor = meta.hex
    }

    // Focus ring uses branch color for keyboard focus; hidden otherwise
    const ringColor = locked ? 'rgba(255,255,255,0.45)' : `${meta.hex}cc`

    // ── Event handlers ────────────────────────────────────────────────────────
    const handleClick = () => { if (!locked) onClick() }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            if (!locked) onClick()
        }
        if ((e.key === '-' || e.key === 'Backspace') && !locked && ranks > 0) {
            e.preventDefault()
            onDecrement?.()
        }
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        if (!locked) onDecrement?.()
    }

    const handlePointerDown = () => { pointerRef.current = true }
    // Use rAF so the flag outlasts the focus event that fires after pointerup
    const handlePointerUp   = () => {
        requestAnimationFrame(() => { pointerRef.current = false })
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!locked) e.currentTarget.style.transform = 'scale(0.92)'
    }
    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = 'scale(1)'
    }

    const handleMouseEnter = () => { setShowTip(true);  onActivate?.(true)  }
    const handleMouseLeave = () => { setShowTip(false); onActivate?.(false) }

    const handleFocus = () => {
        setShowTip(true)
        if (!pointerRef.current) setKbFocused(true)
        onActivate?.(true)
    }
    const handleBlur = () => {
        setShowTip(false)
        setKbFocused(false)
        onActivate?.(false)
    }

    // ── Tooltip state + positioning ───────────────────────────────────────────
    const tooltip = showTip

    const tipVertical: React.CSSProperties = tooltipSide === 'below'
        ? { top: '100%', marginTop: 8 }
        : { bottom: '100%', marginBottom: 8 }

    const tipHorizontal: React.CSSProperties =
        tooltipAlign === 'left'  ? { left: 0 } :
        tooltipAlign === 'right' ? { right: 0, left: 'auto' } :
        { left: '50%', transform: 'translateX(-50%)' }

    // Compose the aria-label: name + branch + rank/selected state + lock status
    const rankFragment = node.maxRanks > 1
        ? `, ${ranks} of ${node.maxRanks} ranks`
        : ranks > 0 ? ', selected' : ''
    const lockFragment = locked ? ', locked' : ''
    const ariaLabel = `${node.name}${rankFragment}, ${node.branch}${lockFragment}`

    return (
        <div
            className="relative flex flex-col items-center"
            style={{ zIndex: tooltip ? 60 : 'auto' }}
        >
            {/* ── Button ────────────────────────────────────────────────────── */}
            <button
                type="button"
                role="switch"
                aria-checked={ranks > 0}
                aria-disabled={locked || undefined}
                aria-label={ariaLabel}
                aria-describedby={tooltip ? tipId : undefined}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                onContextMenu={handleContextMenu}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                // Never truly disabled — locked nodes remain in tab order for a11y
                className="relative flex items-center justify-center select-none transition-transform duration-100"
                style={{
                    width:        sz,
                    height:       sz,
                    borderRadius: rSz,
                    background:   bgColor,
                    border:       `${isMajor ? 2 : 1.5}px solid ${borderColor}`,
                    cursor:       locked ? 'not-allowed' : 'pointer',
                    boxShadow:    ranks > 0 || maxed
                        ? `0 0 0 1px rgba(0,0,0,0.6), 0 0 14px ${glowColor}, 0 2px 8px rgba(0,0,0,0.7)`
                        : '0 0 0 1px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.6)',
                    // Focus ring — keyboard focus only (kbFocused state)
                    outline:       kbFocused ? `2px solid ${ringColor}` : '2px solid transparent',
                    outlineOffset: 3,
                    transition:   'transform 0.1s, box-shadow 0.15s, outline-color 0.15s',
                }}
            >
                {/* Locked: padlock icon */}
                {locked && (
                    <svg
                        className="absolute inset-0 m-auto"
                        width={13} height={13}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                )}

                {/* Multi-rank: show current rank count */}
                {!locked && node.maxRanks > 1 && (
                    <span
                        className="text-[11px] font-bold leading-none tabular-nums"
                        style={{ color: contentColor }}
                        aria-hidden="true"
                    >
                        {ranks > 0 ? ranks : <span style={{ opacity: 0.35 }}>0</span>}
                    </span>
                )}

                {/* Single-rank selected: checkmark */}
                {!locked && node.maxRanks === 1 && ranks === 1 && (
                    <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                         stroke={contentColor} strokeWidth={2.5}
                         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                )}

                {/* Single-rank available: subtle dot */}
                {!locked && node.maxRanks === 1 && ranks === 0 && (
                    <span
                        className="block rounded-full"
                        aria-hidden="true"
                        style={{ width: 7, height: 7, background: contentColor }}
                    />
                )}
            </button>

            {/* ── Rank pips ─────────────────────────────────────────────────── */}
            <RankPips
                ranks={ranks}
                maxRanks={node.maxRanks}
                color={meta.hex}
                locked={locked}
            />

            {/* ── Name label ────────────────────────────────────────────────── */}
            <NodeLabel name={node.name} color={contentColor} locked={locked} />

            {/* ── Tooltip ───────────────────────────────────────────────────── */}
            {tooltip && (
                <div
                    id={tipId}
                    role="tooltip"
                    className="absolute z-[70] w-56 rounded-xl pointer-events-none"
                    style={{
                        ...tipVertical,
                        ...tipHorizontal,
                        background: 'rgba(7,9,13,0.98)',
                        border:     `1px solid ${locked ? 'rgba(255,255,255,0.07)' : `${meta.hex}50`}`,
                        boxShadow:  '0 8px 36px rgba(0,0,0,0.9)',
                        padding:    '10px 12px',
                    }}
                >
                    {/* Accent line */}
                    <div
                        className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
                        style={{ background: locked ? 'rgba(255,255,255,0.06)' : meta.hex }}
                    />

                    <p className="text-[11px] font-bold text-white mb-1 leading-snug">{node.name}</p>
                    <p className="text-[10px] text-white/55 leading-relaxed">{node.description}</p>

                    {/* Rank detail */}
                    {node.maxRanks > 1 && !locked && (
                        <p className="text-[10px] font-semibold mt-1.5" style={{ color: meta.hex }}>
                            {ranks}/{node.maxRanks} ranks
                        </p>
                    )}

                    {/* Lock explanations */}
                    {locked && node.pointGate > 0 && (
                        <p className="text-[10px] text-amber-400/85 mt-1.5">
                            ⚠ Requires {node.pointGate} branch points
                        </p>
                    )}
                    {locked && lockReason && (
                        <p className="text-[10px] text-white/40 mt-0.5">{lockReason}</p>
                    )}

                    {/* Interaction hint */}
                    {!locked && (
                        <p className="text-[9px] text-white/25 mt-1.5 tabular-nums">
                            {node.maxRanks > 1
                                ? `Click +1 · Right-click −1 · [ − ] key`
                                : `Click to ${ranks === 1 ? 'deselect' : 'select'}`}
                        </p>
                    )}
                    {locked && (
                        <p className="text-[9px] text-white/25 mt-1.5">
                            Unlock prerequisites first
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
