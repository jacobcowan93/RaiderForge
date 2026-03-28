'use client'

import { createPortal } from 'react-dom'
import type { CSSProperties, FocusEvent, KeyboardEvent, MouseEvent } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import { resolveBlueprintImage } from '@/lib/blueprints/resolveBlueprintImage'
import {
    formatRarityLabel,
    getRarityVisualTier,
    rarityCardContainerClasses,
    rarityImageBackdropClass,
} from '@/lib/blueprints/rarityCardStyles'

const blueprintGridStyle: CSSProperties = {
    backgroundImage: `linear-gradient(rgba(56, 189, 248, 0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.07) 1px, transparent 1px)`,
    backgroundSize: '12px 12px',
}

const VIEW_PAD = 10
const GAP = 10

function BlueprintInspectPanel({
    open,
    blueprint: b,
    anchorRef,
}: {
    open: boolean
    blueprint: NormalizedBlueprint
    anchorRef: React.RefObject<HTMLDivElement | null>
}) {
    const panelRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [entered, setEntered] = useState(false)
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!open) {
            setEntered(false)
            return
        }
        const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
        return () => cancelAnimationFrame(id)
    }, [open])

    useLayoutEffect(() => {
        if (!open || !mounted) return
        const anchor = anchorRef.current
        const panel = panelRef.current
        if (!anchor || !panel) return

        const place = () => {
            const a = anchor.getBoundingClientRect()
            const rect = panel.getBoundingClientRect()
            const vw = window.innerWidth
            const vh = window.innerHeight
            const w = Math.min(Math.max(rect.width, 260), vw - 2 * VIEW_PAD)
            const h = rect.height

            let top = a.bottom + GAP
            let left = a.left + a.width / 2 - w / 2

            if (top + h > vh - VIEW_PAD) {
                top = a.top - h - GAP
            }
            if (top < VIEW_PAD) {
                top = VIEW_PAD
            }

            left = Math.max(VIEW_PAD, Math.min(left, vw - w - VIEW_PAD))

            if (left + w > vw - VIEW_PAD) {
                left = vw - w - VIEW_PAD
            }

            const spaceRight = vw - a.right - VIEW_PAD
            const spaceLeft = a.left - VIEW_PAD
            if (top + h > vh - VIEW_PAD && spaceRight >= w + GAP) {
                top = Math.max(VIEW_PAD, a.top + a.height / 2 - h / 2)
                left = a.right + GAP
            } else if (top + h > vh - VIEW_PAD && spaceLeft >= w + GAP) {
                top = Math.max(VIEW_PAD, a.top + a.height / 2 - h / 2)
                left = a.left - w - GAP
            }

            setPos({ top, left })
        }

        place()
        const t = requestAnimationFrame(place)
        window.addEventListener('scroll', place, true)
        window.addEventListener('resize', place)
        return () => {
            cancelAnimationFrame(t)
            window.removeEventListener('scroll', place, true)
            window.removeEventListener('resize', place)
        }
    }, [open, mounted, anchorRef, b.id, b.description, b.foundIn.length, b.name])

    if (!mounted || !open) return null

    const desc = b.description?.trim()
    const hasFound = b.foundIn.length > 0

    const body = (
        <div
            ref={panelRef}
            role="tooltip"
            id={`bp-inspect-${b.id}`}
            className="pointer-events-none fixed z-[200] w-72 max-w-[min(18rem,calc(100vw-20px))] overflow-y-auto overscroll-contain rounded-lg border border-white/[0.12] bg-[rgba(8,10,16,0.94)] px-3.5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md transition-[opacity,transform] duration-200 ease-out will-change-transform"
            style={{
                top: pos.top,
                left: pos.left,
                maxHeight: 'min(42vh, 17rem)',
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)',
            }}
        >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/95 leading-snug border-b border-white/10 pb-2 mb-2">
                {b.name}
            </p>
            {desc ? (
                <p className="text-[11px] leading-relaxed text-rf-textSoft/95 mb-3">{desc}</p>
            ) : null}
            {hasFound ? (
                <div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-rf-red/85 mb-1.5">Found in</p>
                    <div className="flex flex-wrap gap-1">
                        {b.foundIn.map((t) => (
                            <span
                                key={t}
                                className="text-[9px] uppercase tracking-wide px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-rf-textSoft"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
            {b.rarity ? (
                <p className="text-[9px] uppercase tracking-wider text-rf-textSoft/75 mt-2.5 pt-2 border-t border-white/[0.06]">
                    Rarity: <span className="text-rf-text">{formatRarityLabel(b.rarity)}</span>
                </p>
            ) : null}
        </div>
    )

    return createPortal(body, document.body)
}

export type BlueprintCardProps = {
    blueprint: NormalizedBlueprint
    owned: boolean
    onOwnedChange: (owned: boolean) => void
    quickToggleMode?: boolean
}

export function BlueprintCard({ blueprint: b, owned, onOwnedChange, quickToggleMode }: BlueprintCardProps) {
    const tier = getRarityVisualTier(b.rarity)
    const img = resolveBlueprintImage(b)
    const wrapRef = useRef<HTMLDivElement>(null)
    const [inspectOpen, setInspectOpen] = useState(false)

    function handleCardClick(e: MouseEvent) {
        if (!quickToggleMode) return
        const t = e.target as HTMLElement
        if (t.closest('label') || t.closest('input[type="checkbox"]')) return
        onOwnedChange(!owned)
    }

    function handleFocusWithin() {
        setInspectOpen(true)
    }

    function handleBlurWithin(e: FocusEvent<HTMLDivElement>) {
        const next = e.relatedTarget as Node | null
        if (next && wrapRef.current?.contains(next)) return
        setInspectOpen(false)
    }

    return (
        <div
            ref={wrapRef}
            className="relative isolate"
            onMouseEnter={() => setInspectOpen(true)}
            onMouseLeave={() => setInspectOpen(false)}
            onFocusCapture={handleFocusWithin}
            onBlurCapture={handleBlurWithin}
        >
            <article
                aria-describedby={inspectOpen ? `bp-inspect-${b.id}` : undefined}
                className={`group ${rarityCardContainerClasses(tier, 'compact')} ${quickToggleMode ? 'cursor-pointer' : ''}`}
                onClick={handleCardClick}
                onKeyDown={
                    quickToggleMode
                        ? (e: KeyboardEvent) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  const t = e.target as HTMLElement
                                  if (t.closest('label') || t.closest('input')) return
                                  e.preventDefault()
                                  onOwnedChange(!owned)
                              }
                          }
                        : undefined
                }
                tabIndex={quickToggleMode ? 0 : undefined}
                role={quickToggleMode ? 'button' : undefined}
                aria-pressed={quickToggleMode ? owned : undefined}
            >
                <div className="px-1.5 pt-1 pb-0.5 flex items-start justify-between gap-1 min-w-0">
                    <h2 className="min-w-0 flex-1 text-left text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-rf-text/95 leading-tight truncate group-hover:text-white transition-colors">
                        {b.name}
                    </h2>
                    <label className="shrink-0 flex items-center justify-center cursor-pointer touch-manipulation p-0.5 -mr-0.5 -mt-0.5 rounded hover:bg-white/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rf-red/40 z-[2]">
                        <span className="sr-only">Owned</span>
                        <input
                            type="checkbox"
                            checked={owned}
                            onChange={(e) => onOwnedChange(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-white/30 bg-rf-bg/90 accent-rf-green focus:ring-0 focus:ring-offset-0"
                        />
                    </label>
                </div>

                <div
                    className="relative mx-1 mb-1 aspect-[5/4] max-h-[6.75rem] sm:max-h-[7.25rem] rounded-md border border-sky-500/20 bg-[#050810] flex items-center justify-center overflow-hidden"
                    style={blueprintGridStyle}
                >
                    <div className={`${rarityImageBackdropClass(tier)} rounded-md`} aria-hidden />
                    {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={img}
                            alt=""
                            className="relative z-[1] max-h-[92%] max-w-[96%] object-contain drop-shadow-[0_6px_24px_rgba(0,0,0,0.75)] group-hover:scale-[1.03] transition-transform duration-200 ease-out"
                        />
                    ) : (
                        <span className="relative z-[1] text-rf-textSoft/70 text-[9px] uppercase tracking-widest">No image</span>
                    )}
                </div>
            </article>

            <BlueprintInspectPanel open={inspectOpen} blueprint={b} anchorRef={wrapRef} />
        </div>
    )
}
