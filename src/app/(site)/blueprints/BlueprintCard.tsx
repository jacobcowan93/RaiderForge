'use client'

import type { CSSProperties, KeyboardEvent, MouseEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import { stripTrailingBlueprintSuffix } from '@/lib/blueprints/blueprintSlug'
import { resolveBlueprintImageCandidates } from '@/lib/blueprints/resolveBlueprintImage'
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

const VIEW_PAD = 8
const GAP = 8
const PANEL_MAX_W = 320

export type BlueprintCardProps = {
    blueprint: NormalizedBlueprint
    owned: boolean
    onOwnedChange: (owned: boolean) => void
    quickToggleMode?: boolean
}

function containsNode(root: HTMLElement | null, node: Node | null | undefined): boolean {
    if (!root || !node) return false
    return root.contains(node)
}

type InspectPanelProps = {
    open: boolean
    anchorRef: RefObject<HTMLElement | null>
    panelRef: RefObject<HTMLDivElement | null>
    blueprint: NormalizedBlueprint
    titleLabel: string
    onPanelEnter: () => void
    onPanelLeave: (e: MouseEvent) => void
}

function BlueprintInspectPanel({
    open,
    anchorRef,
    panelRef,
    blueprint: b,
    titleLabel,
    onPanelEnter,
    onPanelLeave,
}: InspectPanelProps) {
    const [box, setBox] = useState<CSSProperties>(() => ({
        position: 'fixed',
        left: 0,
        top: 0,
        width: PANEL_MAX_W,
        maxWidth: `min(${PANEL_MAX_W}px, calc(100vw - ${VIEW_PAD * 2}px))`,
        zIndex: 200,
        opacity: 0,
        transform: 'translateY(6px)',
        pointerEvents: 'none' as const,
        transition: 'opacity 0.16s ease-out, transform 0.16s ease-out',
    }))

    useLayoutEffect(() => {
        if (!open) return

        const el = anchorRef.current
        if (!el) return

        const measure = () => {
            const ar = el.getBoundingClientRect()
            const panel = panelRef.current
            const pw = Math.min(PANEL_MAX_W, window.innerWidth - VIEW_PAD * 2)
            const ph = panel?.offsetHeight ?? 180

            const spaceBelow = window.innerHeight - ar.bottom - VIEW_PAD
            const spaceAbove = ar.top - VIEW_PAD
            let top = ar.bottom + GAP
            let left = ar.left + ar.width / 2 - pw / 2
            let placement: 'below' | 'above' | 'right' | 'left' = 'below'

            if (spaceBelow < ph + GAP && spaceAbove > spaceBelow) {
                top = ar.top - GAP - ph
                placement = 'above'
            }
            if (placement === 'below' && spaceBelow < ph + GAP && window.innerWidth - ar.right - VIEW_PAD > pw + GAP) {
                top = ar.top + ar.height / 2 - ph / 2
                left = ar.right + GAP
                placement = 'right'
            } else if (placement === 'below' && spaceBelow < ph + GAP && ar.left - VIEW_PAD > pw + GAP) {
                top = ar.top + ar.height / 2 - ph / 2
                left = ar.left - GAP - pw
                placement = 'left'
            }

            left = Math.min(Math.max(left, VIEW_PAD), window.innerWidth - VIEW_PAD - pw)
            top = Math.min(Math.max(top, VIEW_PAD), window.innerHeight - VIEW_PAD - ph)

            return {
                top,
                left,
                width: pw,
                maxWidth: `min(${PANEL_MAX_W}px, calc(100vw - ${VIEW_PAD * 2}px))` as const,
                enterTransform:
                    placement === 'above'
                        ? 'translateY(-6px)'
                        : placement === 'below'
                          ? 'translateY(6px)'
                          : placement === 'right'
                            ? 'translateX(-6px)'
                            : 'translateX(6px)',
            }
        }

        const pos0 = measure()
        setBox((prev) => ({
            ...prev,
            top: pos0.top,
            left: pos0.left,
            width: pos0.width,
            maxWidth: pos0.maxWidth,
            opacity: 0,
            transform: pos0.enterTransform,
            pointerEvents: 'none',
        }))

        const show = requestAnimationFrame(() => {
            const pos = measure()
            setBox((prev) => ({
                ...prev,
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxWidth: pos.maxWidth,
                opacity: 1,
                transform: 'translate(0,0)',
                pointerEvents: 'auto',
            }))
        })

        const reposition = () => {
            const pos = measure()
            setBox((prev) => ({
                ...prev,
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxWidth: pos.maxWidth,
            }))
        }

        window.addEventListener('scroll', reposition, true)
        window.addEventListener('resize', reposition)
        return () => {
            cancelAnimationFrame(show)
            window.removeEventListener('scroll', reposition, true)
            window.removeEventListener('resize', reposition)
        }
    }, [open, anchorRef, panelRef, b.id])

    const desc = b.description?.trim()

    if (typeof document === 'undefined' || !open) return null

    return createPortal(
        <div
            ref={panelRef}
            role="tooltip"
            className="rf-card rounded-lg border border-white/[0.12] bg-rf-bg/98 backdrop-blur-md shadow-2xl shadow-black/60 px-3 py-2.5 text-left"
            style={box}
            onMouseEnter={onPanelEnter}
            onMouseLeave={onPanelLeave}
        >
            <p className="text-xs font-bold uppercase tracking-wide text-white leading-snug">{titleLabel}</p>
            {b.rarity?.trim() ? (
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-rf-textSoft">
                    {formatRarityLabel(b.rarity)}
                </p>
            ) : null}
            {desc ? <p className="mt-2 text-xs text-rf-textSoft leading-relaxed">{desc}</p> : null}
            {b.foundIn.length > 0 ? (
                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-rf-red/85 mb-1.5">Found in</p>
                    <div className="flex flex-wrap gap-1">
                        {b.foundIn.map((t) => (
                            <span
                                key={t}
                                className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-rf-textSoft"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>,
        document.body
    )
}

export function BlueprintCard({ blueprint: b, owned, onOwnedChange, quickToggleMode }: BlueprintCardProps) {
    const tier = getRarityVisualTier(b.rarity)
    const candidates = useMemo(() => resolveBlueprintImageCandidates(b), [b])
    const [attempt, setAttempt] = useState(0)

    const containerRef = useRef<HTMLDivElement>(null)
    const anchorRef = useRef<HTMLElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    const [hoverCard, setHoverCard] = useState(false)
    const [hoverPanel, setHoverPanel] = useState(false)
    const [focusInside, setFocusInside] = useState(false)

    useEffect(() => {
        setAttempt(0)
    }, [b.id])

    const src = attempt < candidates.length ? candidates[attempt] : undefined
    const titleLabel = stripTrailingBlueprintSuffix(b.trackerDisplayName ?? b.name)

    const inspectOpen = hoverCard || hoverPanel || focusInside

    function handleCardClick(e: MouseEvent) {
        if (!quickToggleMode) return
        const t = e.target as HTMLElement
        if (t.closest('label') || t.closest('input[type="checkbox"]')) return
        onOwnedChange(!owned)
    }

    return (
        <div
            ref={containerRef}
            className="relative isolate"
            onMouseEnter={() => setHoverCard(true)}
            onMouseLeave={(e) => {
                const next = e.relatedTarget as Node | null
                if (containsNode(panelRef.current, next)) return
                setHoverCard(false)
            }}
            onFocusCapture={() => setFocusInside(true)}
            onBlurCapture={(e) => {
                const next = e.relatedTarget as Node | null
                if (containsNode(containerRef.current, next) || containsNode(panelRef.current, next)) return
                setFocusInside(false)
            }}
        >
            {inspectOpen ? (
                <BlueprintInspectPanel
                    open={inspectOpen}
                    anchorRef={anchorRef}
                    panelRef={panelRef}
                    blueprint={b}
                    titleLabel={titleLabel}
                    onPanelEnter={() => setHoverPanel(true)}
                    onPanelLeave={(e) => {
                        const next = e.relatedTarget as Node | null
                        if (containsNode(containerRef.current, next)) {
                            setHoverPanel(false)
                            return
                        }
                        setHoverPanel(false)
                        setHoverCard(false)
                    }}
                />
            ) : null}

            <article
                ref={anchorRef}
                className={`group relative ${rarityCardContainerClasses(tier, 'compact')} ${quickToggleMode ? 'cursor-pointer' : ''}`}
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
                <label
                    className="absolute top-1.5 right-1.5 z-[2] flex cursor-pointer touch-manipulation rounded-md bg-black/35 p-1 backdrop-blur-[2px] border border-white/10 shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <span className="sr-only">Owned</span>
                    <input
                        type="checkbox"
                        checked={owned}
                        onChange={(e) => onOwnedChange(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-3.5 w-3.5 rounded border-white/30 bg-rf-bg/90 accent-rf-green focus:ring-2 focus:ring-rf-red/35 focus:ring-offset-0 shrink-0"
                    />
                </label>

                <div className="flex flex-col flex-1 min-h-0 min-w-0 px-2 pt-2 pb-1.5 gap-1">
                    <h2
                        className={`pr-9 text-left text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-rf-text leading-tight line-clamp-2 transition-colors ${
                            owned ? 'line-through text-rf-textSoft/70' : 'group-hover:text-white'
                        }`}
                    >
                        {titleLabel}
                    </h2>

                    <div
                        className="relative w-full aspect-[5/4] max-h-[4.75rem] sm:max-h-[5.25rem] rounded-md border border-sky-500/15 bg-[#050810] flex items-center justify-center overflow-hidden p-1"
                        style={blueprintGridStyle}
                    >
                        <div className={`${rarityImageBackdropClass(tier)} rounded-md`} aria-hidden />
                        {src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={`${b.id}-${attempt}-${src.slice(0, 48)}`}
                                src={src}
                                alt=""
                                onError={() => setAttempt((a) => a + 1)}
                                className={`relative z-[1] h-full w-full max-h-full max-w-full object-contain object-center drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)] transition-opacity duration-200 ${
                                    owned ? 'opacity-45' : 'opacity-100'
                                }`}
                            />
                        ) : (
                            <span className="relative z-[1] text-rf-textSoft/60 text-[9px] uppercase tracking-widest">
                                No image
                            </span>
                        )}
                    </div>
                </div>
            </article>
        </div>
    )
}
