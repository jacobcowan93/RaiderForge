'use client'

import Image from 'next/image'
import { memo, useCallback, useId, useRef, useState } from 'react'

import type { SkillNode, SkillNodeState } from '@/data/skillTree'
import { BRANCH_META } from '@/data/skillTree'

/**
 * Interactive skill node: pointer, keyboard, and context-menu decrement.
 *
 * - **Multi-rank:** `role="spinbutton"` with `aria-valuemin` / `aria-valuemax` / `aria-valuenow`.
 * - **Single-rank:** `role="button"` with `aria-pressed` for allocated state.
 * - **Keyboard:** ArrowUp/Right/+ add; ArrowDown/Left/−/Backspace remove; Numpad +/- supported.
 * - **Touch:** `touch-manipulation` on the button to reduce double-tap zoom delay.
 *
 * Exported wrapped in `memo()` so parent re-renders (e.g. canvas pan) do not re-render every node.
 */

interface Props {
    node: SkillNode
    ranks: number
    state: SkillNodeState
    lockReason?: string | null
    onClick: () => void
    onDecrement?: () => void
    tooltipSide?: 'above' | 'below'
    tooltipAlign?: 'left' | 'center' | 'right'
    onActivate?: (active: boolean) => void
}

function RankBadge({
    ranks,
    maxRanks,
    color,
    locked,
}: {
    ranks: number
    maxRanks: number
    color: string
    locked: boolean
}) {
    if (maxRanks <= 1) return null
    return (
        <div
            className="absolute bottom-[-1px] left-1/2 -translate-x-1/2
                       rounded-full px-[5px] py-[1px] text-[8px] font-bold
                       tabular-nums leading-none pointer-events-none select-none
                       whitespace-nowrap z-10"
            style={{
                background: locked ? 'rgba(20,25,35,0.92)' : 'rgba(5,7,12,0.92)',
                border: `1px solid ${locked ? 'rgba(255,255,255,0.10)' : color + '80'}`,
                color: locked ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.90)',
                boxShadow: locked ? 'none' : `0 0 6px ${color}55`,
            }}
            aria-hidden
        >
            {ranks}/{maxRanks}
        </div>
    )
}

function SkillNodeBtnInner({
    node,
    ranks,
    state,
    lockReason,
    onClick,
    onDecrement,
    tooltipSide = 'above',
    tooltipAlign = 'center',
    onActivate,
}: Props) {
    const [showTip, setShowTip] = useState(false)
    const [kbFocused, setKbFocused] = useState(false)
    const tipId = useId()
    const meta = BRANCH_META[node.branch]
    const isMajor = node.size === 'major'
    const locked = state === 'locked'
    const maxed = state === 'maxed'
    const active = ranks > 0
    const multi = node.maxRanks > 1

    const pointerRef = useRef(false)

    const sz = isMajor ? 52 : 38
    const iconSz = isMajor ? 30 : 22
    const borderW = isMajor ? 2.5 : 2

    let borderColor: string
    let glowShadow = ''
    let bgFill: string

    if (locked) {
        bgFill = 'rgba(10,13,20,0.95)'
        borderColor = 'rgba(255,255,255,0.08)'
    } else if (ranks === 0) {
        bgFill = 'rgba(0,0,0,0.10)'
        borderColor = `${meta.hex}55`
    } else if (!maxed) {
        bgFill = meta.hex
        borderColor = meta.hex
        glowShadow = `0 0 12px ${meta.hex}50, 0 0 4px ${meta.hex}30`
    } else {
        bgFill = meta.hex
        borderColor = 'rgba(255,255,255,0.75)'
        glowShadow = `0 0 22px ${meta.hex}85, 0 0 8px ${meta.hex}60`
    }

    const ringColor = locked ? 'rgba(255,255,255,0.45)' : `${meta.hex}cc`

    const handleClick = useCallback(() => {
        if (!locked) onClick()
    }, [locked, onClick])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLButtonElement>) => {
            if (locked) return
            const addKeys =
                e.key === 'ArrowUp' ||
                e.key === 'ArrowRight' ||
                e.key === '+' ||
                e.key === 'NumpadAdd' ||
                (e.key === '=' && !e.shiftKey)
            const removeKeys =
                e.key === 'ArrowDown' ||
                e.key === 'ArrowLeft' ||
                e.key === '-' ||
                e.key === 'NumpadSubtract' ||
                e.key === 'Minus' ||
                e.key === 'Backspace'
            if (multi) {
                if (addKeys) {
                    e.preventDefault()
                    onClick()
                    return
                }
                if (removeKeys) {
                    e.preventDefault()
                    if (ranks > 0) onDecrement?.()
                    return
                }
            }
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
                return
            }
            if ((e.key === '-' || e.key === 'Backspace' || e.key === 'NumpadSubtract' || e.key === 'Minus') && ranks > 0) {
                e.preventDefault()
                onDecrement?.()
            }
        },
        [locked, multi, onClick, onDecrement, ranks],
    )

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        if (!locked) onDecrement?.()
    }
    const handlePointerDown = () => {
        pointerRef.current = true
    }
    const handlePointerUp = () => {
        requestAnimationFrame(() => {
            pointerRef.current = false
        })
    }
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!locked) e.currentTarget.style.transform = 'scale(0.90)'
    }
    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.transform = 'scale(1)'
    }
    const handleMouseEnter = () => {
        setShowTip(true)
        onActivate?.(true)
    }
    const handleMouseLeave = () => {
        setShowTip(false)
        onActivate?.(false)
    }
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

    const tipVertical: React.CSSProperties =
        tooltipSide === 'below' ? { top: '100%', marginTop: 10 } : { bottom: '100%', marginBottom: 10 }
    const tipHorizontal: React.CSSProperties =
        tooltipAlign === 'left'
            ? { left: 0 }
            : tooltipAlign === 'right'
              ? { right: 0, left: 'auto' }
              : { left: '50%', transform: 'translateX(-50%)' }

    const spinLabel = `${node.name}: ${ranks} of ${node.maxRanks} ranks allocated, ${node.branch}`
    const toggleLabel = `${node.name}, ${ranks > 0 ? 'selected' : 'not selected'}, ${node.branch}`

    const ariaLabel = multi ? spinLabel : toggleLabel

    const tipVerticalDir = tooltipSide === 'below' ? 'below' : 'above'

    return (
        <div className="relative flex flex-col items-center" style={{ zIndex: showTip ? 60 : 'auto' }}>
            <button
                type="button"
                role={multi ? 'spinbutton' : 'button'}
                aria-pressed={!multi && !locked ? ranks > 0 : undefined}
                aria-valuemin={multi ? 0 : undefined}
                aria-valuemax={multi ? node.maxRanks : undefined}
                aria-valuenow={multi ? ranks : undefined}
                aria-disabled={locked || undefined}
                aria-label={ariaLabel}
                aria-describedby={showTip ? tipId : undefined}
                data-tooltip-side={tipVerticalDir}
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
                className="relative flex items-center justify-center select-none transition-transform duration-100 touch-manipulation"
                style={{
                    width: sz,
                    height: sz,
                    borderRadius: '50%',
                    background: bgFill,
                    border: `${borderW}px solid ${borderColor}`,
                    cursor: locked ? 'not-allowed' : 'pointer',
                    boxShadow: ['0 0 0 1px rgba(0,0,0,0.55)', '0 2px 8px rgba(0,0,0,0.70)', glowShadow].filter(Boolean).join(', '),
                    outline: kbFocused ? `2px solid ${ringColor}` : '2px solid transparent',
                    outlineOffset: 3,
                    transition: 'transform 0.1s, box-shadow 0.2s, border-color 0.2s, outline-color 0.15s',
                    overflow: 'hidden',
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center" style={{ padding: isMajor ? 8 : 5 }}>
                    <Image
                        src={node.icon}
                        alt=""
                        width={iconSz}
                        height={iconSz}
                        aria-hidden
                        className="object-contain pointer-events-none"
                        style={{
                            filter: locked
                                ? 'grayscale(1) brightness(0.25)'
                                : active
                                  ? 'brightness(0) invert(1) drop-shadow(0 0 3px rgba(255,255,255,0.5))'
                                  : 'brightness(0.45) saturate(0.7)',
                            transition: 'filter 0.2s',
                        }}
                    />
                </div>

                {locked && (
                    <div
                        className="absolute inset-0 flex items-center justify-center rounded-full"
                        style={{ background: 'rgba(6,8,14,0.55)' }}
                        aria-hidden
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
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                )}

                {maxed && (
                    <div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                            boxShadow: 'inset 0 0 14px rgba(255,255,255,0.40), inset 0 0 5px rgba(255,255,255,0.30)',
                        }}
                        aria-hidden
                    />
                )}
            </button>

            <RankBadge ranks={ranks} maxRanks={node.maxRanks} color={meta.hex} locked={locked} />

            <span
                aria-hidden
                className="block text-center overflow-hidden whitespace-nowrap pointer-events-none select-none"
                style={{
                    fontSize: '7px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    maxWidth: 74,
                    marginTop: node.maxRanks > 1 ? 9 : 4,
                    color: locked ? 'rgba(255,255,255,0.20)' : active ? meta.hex : 'rgba(255,255,255,0.38)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.95)',
                    textOverflow: 'ellipsis',
                    letterSpacing: '0.01em',
                    transition: 'color 0.2s',
                }}
            >
                {node.name}
            </span>

            {showTip && (
                <div
                    id={tipId}
                    role="tooltip"
                    className="absolute z-[70] w-56 rounded-xl pointer-events-none"
                    style={{
                        ...tipVertical,
                        ...tipHorizontal,
                        background: 'rgba(7,9,13,0.98)',
                        border: `1px solid ${locked ? 'rgba(255,255,255,0.07)' : `${meta.hex}50`}`,
                        boxShadow: '0 8px 36px rgba(0,0,0,0.9)',
                        padding: '10px 12px',
                    }}
                >
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
                            Requires {node.pointGate} branch points
                        </p>
                    )}
                    {locked && lockReason && <p className="text-[10px] text-white/40 mt-0.5">{lockReason}</p>}
                    {!locked && (
                        <p className="text-[9px] text-white/25 mt-1.5 tabular-nums">
                            {node.maxRanks > 1
                                ? 'ArrowUp/Right/+ add rank · ArrowDown/Left/−/Backspace remove · Right-click −1'
                                : `Enter or Space to ${ranks === 1 ? 'clear' : 'select'}`}
                        </p>
                    )}
                    {locked && <p className="text-[9px] text-white/25 mt-1.5">Unlock prerequisites first</p>}
                </div>
            )}
        </div>
    )
}

export const SkillNodeBtn = memo(SkillNodeBtnInner)
SkillNodeBtn.displayName = 'SkillNodeBtn'
