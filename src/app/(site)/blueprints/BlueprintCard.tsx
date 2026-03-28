'use client'

import type { KeyboardEvent, MouseEvent } from 'react'
import type { NormalizedBlueprint } from '@/lib/blueprints/normalizeBlueprints'
import {
    formatRarityLabel,
    getRarityVisualTier,
    rarityBadgeClasses,
    rarityCardContainerClasses,
    rarityCardTopBarClass,
    rarityImageBackdropClass,
} from '@/lib/blueprints/rarityCardStyles'

export type BlueprintCardProps = {
    blueprint: NormalizedBlueprint
    owned: boolean
    onOwnedChange: (owned: boolean) => void
    /** When true, clicking the card (outside the checkbox) toggles owned. */
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

            <div className="p-4 flex flex-col flex-1 gap-3 min-h-0">
                <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-rf-text leading-snug group-hover:text-white transition-colors pr-1 min-w-0">
                        {b.name}
                    </h2>
                    <span className={rarityBadgeClasses(tier)}>{formatRarityLabel(b.rarity)}</span>
                </div>

                {desc ? (
                    <p className="text-xs text-rf-textSoft leading-relaxed line-clamp-3 min-h-[2.75rem]">{desc}</p>
                ) : (
                    <div className="min-h-[2.75rem]" aria-hidden />
                )}

                <label className="flex items-center gap-2.5 cursor-pointer select-none touch-manipulation">
                    <input
                        type="checkbox"
                        checked={owned}
                        onChange={(e) => onOwnedChange(e.target.checked)}
                        className="h-4 w-4 rounded border-white/25 bg-rf-bg/80 accent-rf-green focus:ring-2 focus:ring-rf-red/40 focus:ring-offset-0 focus:ring-offset-transparent"
                    />
                    <span className="text-sm text-rf-text">I have this blueprint</span>
                </label>

                <div className="relative h-40 bg-rf-bgSoft shrink-0 flex items-center justify-center p-3 rounded-xl border border-white/[0.06] overflow-hidden mt-1">
                    <div className={rarityImageBackdropClass(tier)} aria-hidden />
                    {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={img}
                            alt=""
                            className="relative z-[1] max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                        />
                    ) : (
                        <span className="relative z-[1] text-rf-textSoft text-[10px] uppercase tracking-widest">No image</span>
                    )}
                </div>

                {b.foundIn.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {b.foundIn.map((t) => (
                            <span
                                key={t}
                                className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-rf-textSoft"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </article>
    )
}
