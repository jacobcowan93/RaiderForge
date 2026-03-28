'use client'

import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react'
import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import { resolveBlueprintImage } from '@/lib/blueprints/resolveBlueprintImage'
import {
    formatRarityLabel,
    getRarityVisualTier,
    rarityBadgeClasses,
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
    const img = resolveBlueprintImage(b)
    const desc = b.description?.trim()

    function handleCardClick(e: MouseEvent) {
        if (!quickToggleMode) return
        const t = e.target as HTMLElement
        if (t.closest('label') || t.closest('input[type="checkbox"]')) return
        onOwnedChange(!owned)
    }

    return (
        <article
            className={`group ${rarityCardContainerClasses(tier, 'default')} ${quickToggleMode ? 'cursor-pointer' : ''}`}
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

            <div className="flex flex-col flex-1 min-h-0 p-4 sm:p-5 gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                        <h2
                            className={`text-left text-sm sm:text-base font-bold uppercase tracking-wide text-rf-text leading-snug transition-colors ${
                                owned ? 'line-through text-rf-textSoft/70' : 'group-hover:text-white'
                            }`}
                        >
                            {b.trackerDisplayName ?? b.name}
                        </h2>
                        {b.spreadsheetType ? (
                            <p className="mt-1 text-[10px] uppercase tracking-wider text-rf-textSoft/80">
                                {b.spreadsheetType}
                            </p>
                        ) : null}
                    </div>
                    <span className={`shrink-0 ${rarityBadgeClasses(tier)}`}>{formatRarityLabel(b.rarity)}</span>
                </div>

                {desc ? (
                    <p className="text-xs sm:text-sm text-rf-textSoft leading-relaxed line-clamp-3">{desc}</p>
                ) : null}

                <label
                    className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-rf-text touch-manipulation"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="checkbox"
                        checked={owned}
                        onChange={(e) => onOwnedChange(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-white/25 bg-rf-bg/80 accent-rf-green focus:ring-2 focus:ring-rf-red/35 focus:ring-offset-0 shrink-0"
                    />
                    <span>I have this blueprint</span>
                </label>

                <div
                    className="relative w-full aspect-[4/3] rounded-xl border border-sky-500/20 bg-[#050810] flex items-center justify-center overflow-hidden p-1.5"
                    style={blueprintGridStyle}
                >
                    <div className={`${rarityImageBackdropClass(tier)} rounded-xl`} aria-hidden />
                    {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={img}
                            alt=""
                            className={`relative z-[1] h-full w-full max-h-full max-w-full object-contain object-center drop-shadow-[0_8px_28px_rgba(0,0,0,0.65)] transition-opacity duration-200 ${
                                owned ? 'opacity-45' : 'opacity-100'
                            }`}
                        />
                    ) : (
                        <span className="relative z-[1] text-rf-textSoft/70 text-xs uppercase tracking-widest">No image</span>
                    )}
                </div>

                {b.foundIn.length > 0 ? (
                    <div className="pt-1 border-t border-white/[0.06]">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-rf-red/85 mb-2">Found in</p>
                        <div className="flex flex-wrap gap-1.5">
                            {b.foundIn.map((t) => (
                                <span
                                    key={t}
                                    className="text-[10px] sm:text-xs uppercase tracking-wide px-2 py-1 rounded-md bg-white/[0.05] border border-white/10 text-rf-textSoft"
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </article>
    )
}
