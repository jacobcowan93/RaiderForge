'use client'

import Image from 'next/image'
import type { SkillNode, SkillNodeState } from '@/data/skillTree'
import { BRANCH_META } from '@/data/skillTree'
import { useId, useRef, useState } from 'react'

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

// ── Rank badge ────────────────────────────────────────────────────────────────
// Small "N/max" pill pinned to the bottom of the circle for multi-rank nodes.

function RankBadge({ ranks, maxRanks, color, locked }: {
    ranks:    number
    maxRanks: number
    color:    string
    locked:   boolean
}) {
    if (maxRanks <= 1) return null
    return (
        <div
            className="absolute bottom-[-1px] left-1/2 -translate-x-1/2
                       rounded-full px-[5px] py-[1px] text-[8px] font-bold
                       tabular-nums leading-none pointer-events-none select-none
                       whitespace-nowrap z-10"
            style={{
                background:  locked ? 'rgba(20,25,35,0.92)' : 'rgba(10,12,18,0.94)',
                border:      `1px solid ${locked ? 'rgba(255,255,255,0.10)' : color + '60'}`,
                color:       locked ? 'rgba(255,255,255,0.28)' : color,
                boxShadow:   locked ? 'none' : `0 0 6px ${color}44`,
            }}
        >
            {ranks}/{maxRanks}
        </div>
    )
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
    const [showTip,   setShowTip]   = useState(false)
    const [kbFocused, setKbFocused] = useState(false)
    const tipId     = useId()
    const meta      = BRANCH_META[node.branch]
    const isMajor   = node.size === 'major'
    const locked    = state === 'locked'
    const maxed     = state === 'maxed'
    const active    = ranks > 0

    const pointerRef = useRef(false)

    // ── Sizes ─────────────────────────────────────────────────────────────────
    // Major nodes: 52px · Minor: 38px — matches the in-game proportions
    const sz      = isMajor ? 52 : 38
    const iconSz  = isMajor ? 30 : 22   // icon inner size
    const borderW = isMajor ? 2.5 : 2

    // ── Border / glow by state ────────────────────────────────────────────────
    let borderColor = 'rgba(255,255,255,0.08)'
    let glowShadow  = 'none'
    let bgTint      = 'rgba(14,18,26,0.97)'

    if (!locked && ranks === 0) {
        // Available but unspent — subtle branch-colour hint
        borderColor = `${meta.hex}35`
    }
    if (active && !maxed) {
        borderColor = `${meta.hex}80`
        bgTint      = `${meta.hex}14`
        glowShadow  = `0 0 12px ${meta.hex}30, 0 0 4px ${meta.hex}20`
    }
    if (maxed) {
        borderColor = meta.hex
        bgTint      = `${meta.hex}22`
        glowShadow  = `0 0 18px ${meta.hex}55, 0 0 6px ${meta.hex}35`
    }

    const ringColor = locked ? 'rgba(255,255,255,0.45)' : `${meta.hex}cc`

    // ── Event handlers ────────────────────────────────────────────────────────
    const handleClick      = () => { if (!locked) onClick() }
    const handleKeyDown    = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!locked) onClick() }
        if ((e.key === '-' || e.key === 'Backspace') && !locked && ranks > 0) {
            e.preventDefault(); onDecrement?.()
        }
    }
    const handleContextMenu = (e: React.MouseEvent) => { e.preventDefault(); if (!locked) onDecrement?.() }
    const handlePointerDown = () => { pointerRef.current = true }
    const handlePointerUp   = () => { requestAnimationFrame(() => { pointerRef.current = false }) }
    const handleMouseDown   = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!locked) e.currentTarget.style.transform = 'scale(0.90)'
    }
    const handleMouseUp     = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = 'scale(1)'
    }
    const handleMouseEnter  = () => { setShowTip(true);  onActivate?.(true)  }
    const handleMouseLeave  = () => { setShowTip(false); onActivate?.(false) }
    const handleFocus       = () => {
        setShowTip(true)
        if (!pointerRef.current) setKbFocused(true)
        onActivate?.(true)
    }
    const handleBlur        = () => { setShowTip(false); setKbFocused(false); onActivate?.(false) }

    // ── Tooltip position ─────────────────────────────────────────────────────
    const tipVertical: React.CSSProperties = tooltipSide === 'below'
        ? { top: '100%', marginTop: 10 }
        : { bottom: '100%', marginBottom: 10 }
    const tipHorizontal: React.CSSProperties =
        tooltipAlign === 'left'  ? { left: 0 } :
        tooltipAlign === 'right' ? { right: 0, left: 'auto' } :
        { left: '50%', transform: 'translateX(-50%)' }

    // ── Aria label ────────────────────────────────────────────────────────────
    const rankFragment = node.maxRanks > 1
        ? `, ${ranks} of ${node.maxRanks} ranks`
        : ranks > 0 ? ', selected' : ''
    const ariaLabel = `${node.name}${rankFragment}, ${node.branch}${locked ? ', locked' : ''}`

    return (
        <div
            className="relative flex flex-col items-center"
            style={{ zIndex: showTip ? 60 : 'auto' }}
        >
            {/* ── Circular button ───────────────────────────────────────────── */}
            <button
                type="button"
                role="switch"
                aria-checked={ranks > 0}
                aria-disabled={locked || undefined}
                aria-label={ariaLabel}
                aria-describedby={showTip ? tipId : undefined}
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
                className="relative flex items-center justify-center select-none transition-transform duration-100"
                style={{
                    width:        sz,
                    height:       sz,
                    borderRadius: '50%',
                    background:   bgTint,
                    border:       `${borderW}px solid ${borderColor}`,
                    cursor:       locked ? 'not-allowed' : 'pointer',
                    boxShadow:    [
                        '0 0 0 1px rgba(0,0,0,0.55)',
                        '0 2px 8px rgba(0,0,0,0.70)',
                        glowShadow,
                    ].filter(Boolean).join(', '),
                    outline:       kbFocused ? `2px solid ${ringColor}` : '2px solid transparent',
                    outlineOffset: 3,
                    transition:   'transform 0.1s, box-shadow 0.2s, border-color 0.2s, outline-color 0.15s',
                    overflow:     'hidden',      // keep inner image circular
                }}
            >
                {/* ── Skill icon ──────────────────────────────────────────── */}
                {/* Always rendered; locked = heavy desaturation + dim overlay */}
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ padding: isMajor ? 8 : 5 }}
                >
                    <Image
                        src={node.icon}
                        alt=""
                        width={iconSz}
                        height={iconSz}
                        aria-hidden="true"
                        className="object-contain pointer-events-none"
                        style={{
                            filter: locked
                                ? 'grayscale(1) brightness(0.35)'
                                : active
                                    ? `brightness(1.1) drop-shadow(0 0 3px ${meta.hex}88)`
                                    : 'brightness(0.55)',
                            transition: 'filter 0.2s',
                        }}
                    />
                </div>

                {/* ── Locked overlay (darker tint + padlock) ───────────────── */}
                {locked && (
                    <div
                        className="absolute inset-0 flex items-center justify-center rounded-full"
                        style={{ background: 'rgba(6,8,14,0.55)' }}
                        aria-hidden="true"
                    >
                        <svg
                            width={isMajor ? 14 : 11}
                            height={isMajor ? 14 : 11}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="rgba(255,255,255,0.30)"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                )}

                {/* ── Maxed shimmer ring ────────────────────────────────────── */}
                {maxed && (
                    <div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{ boxShadow: `inset 0 0 8px ${meta.hex}33` }}
                        aria-hidden="true"
                    />
                )}
            </button>

            {/* ── Rank badge (0/5, 1/5 …) ──────────────────────────────────── */}
            <RankBadge
                ranks={ranks}
                maxRanks={node.maxRanks}
                color={meta.hex}
                locked={locked}
            />

            {/* ── Name label ────────────────────────────────────────────────── */}
            <span
                aria-hidden="true"
                className="block text-center overflow-hidden whitespace-nowrap pointer-events-none select-none"
                style={{
                    fontSize:     '7px',
                    fontWeight:   600,
                    lineHeight:   1.2,
                    maxWidth:     74,
                    marginTop:    node.maxRanks > 1 ? 9 : 4,
                    color:        locked ? 'rgba(255,255,255,0.20)' : active ? meta.hex : 'rgba(255,255,255,0.38)',
                    textShadow:   '0 1px 4px rgba(0,0,0,0.95)',
                    textOverflow: 'ellipsis',
                    letterSpacing:'0.01em',
                    transition:   'color 0.2s',
                }}
            >
                {node.name}
            </span>

            {/* ── Tooltip ───────────────────────────────────────────────────── */}
            {showTip && (
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

                    {node.maxRanks > 1 && !locked && (
                        <p className="text-[10px] font-semibold mt-1.5" style={{ color: meta.hex }}>
                            {ranks}/{node.maxRanks} ranks
                        </p>
                    )}
                    {locked && node.pointGate > 0 && (
                        <p className="text-[10px] text-amber-400/85 mt-1.5">
                            ⚠ Requires {node.pointGate} branch points
                        </p>
                    )}
                    {locked && lockReason && (
                        <p className="text-[10px] text-white/40 mt-0.5">{lockReason}</p>
                    )}
                    {!locked && (
                        <p className="text-[9px] text-white/25 mt-1.5 tabular-nums">
                            {node.maxRanks > 1
                                ? `Click +1 · Right-click −1 · [ − ] key`
                                : `Click to ${ranks === 1 ? 'deselect' : 'select'}`}
                        </p>
                    )}
                    {locked && (
                        <p className="text-[9px] text-white/25 mt-1.5">Unlock prerequisites first</p>
                    )}
                </div>
            )}
        </div>
    )
}
