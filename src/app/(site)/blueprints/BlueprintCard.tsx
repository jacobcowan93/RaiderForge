'use client'

import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'
import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import {
    formatRarityLabel,
    getRarityVisualTier,
    rarityCardContainerClasses,
    rarityCardTopBarClass,
    rarityImageBackdropClass,
} from '@/lib/blueprints/rarityCardStyles'

const blueprintGridStyle: CSSProperties = {
    backgroundImage: `linear-gradient(rgba(56, 189, 248, 0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(56, 189, 248, 0.07) 1px, transparent 1px)`,
    backgroundSize: '12px 12px',
}

export type BlueprintCardProps = {
    blueprint: NormalizedBlueprint
    owned: boolean
    onOwnedChange: (owned: boolean) => void
    quickToggleMode?: boolean
}

export function BlueprintCard({ blueprint: b, owned, onOwnedChange, quickToggleMode }: BlueprintCardProps) {
    const tier = getRarityVisualTier(b.rarity)
    const img = b.imageUrl ?? b.iconUrl
    const desc = b.description?.trim()

    function handleCardClick(e: MouseEvent) {
        if (!quickToggleMode) return
        const t = e.target as HTMLElement
        if (t.closest('label') || t.closest('input[type="checkbox"]')) return
        onOwnedChange(!owned)
    }

    return (
        <article
            className={`group ${rarityCardContainerClasses(tier)} ${quickToggleMode ? 'cursor-pointer' : ''}`}
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
            <div className={rarityCardTopBarClass(tier)} aria-hidden />

            {/* Top: name + owned (checkbox only, unobtrusive) + description above image */}
            <div className="px-2.5 pt-2 pb-1.5 flex flex-col gap-1 min-h-0">
                <div className="flex items-start justify-between gap-2 min-w-0">
                    <h2 className="min-w-0 flex-1 text-left text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-rf-text leading-tight truncate group-hover:text-white transition-colors">
                        {b.name}
                    </h2>
                    <label className="shrink-0 flex items-center justify-center cursor-pointer touch-manipulation p-0.5 -mr-0.5 -mt-0.5 rounded hover:bg-white/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rf-red/40">
                        <span className="sr-only">Owned</span>
                        <input
                            type="checkbox"
                            checked={owned}
                            onChange={(e) => onOwnedChange(e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-white/30 bg-rf-bg/90 accent-rf-green focus:ring-0 focus:ring-offset-0"
                        />
                    </label>
                </div>
                {desc ? (
                    <p className="text-[9px] sm:text-[10px] leading-snug text-rf-textSoft/90 line-clamp-2 pr-0.5">
                        {desc}
                    </p>
                ) : null}
            </div>

            {/* Center: image-first tactical panel */}
            <div
                className="relative mx-2 mb-1.5 h-[7.25rem] sm:h-32 rounded-lg border border-sky-500/15 bg-[#070b14] flex items-center justify-center overflow-hidden"
                style={blueprintGridStyle}
            >
                <div className={`${rarityImageBackdropClass(tier)} rounded-lg`} aria-hidden />
                {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={img}
                        alt=""
                        className="relative z-[1] max-h-[88%] max-w-[92%] object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)] group-hover:scale-[1.03] transition-transform duration-300 ease-out"
                    />
                ) : (
                    <span className="relative z-[1] text-rf-textSoft/70 text-[9px] uppercase tracking-widest">No image</span>
                )}
            </div>

            {/* Lower: minimal metadata */}
            {(b.foundIn.length > 0 || b.rarity) && (
                <div className="px-2.5 pb-2 pt-0 flex flex-wrap items-center gap-1.5">
                    {b.rarity ? (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-rf-textSoft/80">
                            {formatRarityLabel(b.rarity)}
                        </span>
                    ) : null}
                    {b.foundIn.map((t) => (
                        <span
                            key={t}
                            className="text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 text-rf-textSoft/90"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            )}
        </article>
    )
}
