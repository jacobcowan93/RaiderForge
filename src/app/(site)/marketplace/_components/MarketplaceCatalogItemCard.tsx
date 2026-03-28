'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import type { MarketplaceCatalogItem } from '@/lib/marketplace/catalog-types'
import { catalogItemImageCandidates } from '@/lib/marketplace/catalogItemImage'
import {
    formatRarityLabel,
    getRarityVisualTier,
    rarityCardContainerClasses,
    rarityCardTopBarClass,
    rarityImageBackdropClass,
} from '@/lib/blueprints/rarityCardStyles'
import { TypeBadge } from './MarketplaceShared'

const catalogGridStyle: CSSProperties = {
    backgroundImage: `linear-gradient(rgba(59, 91, 150, 0.085) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 91, 150, 0.075) 1px, transparent 1px)`,
    backgroundSize: '12px 12px',
}

const btnDetails =
    'inline-flex w-full items-center justify-center rounded-lg border border-rf-red/35 bg-rf-bg/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rf-red hover:border-rf-red/55 hover:bg-rf-red/10 hover:text-rf-red transition-colors'

export function MarketplaceCatalogItemCard({ item }: { item: MarketplaceCatalogItem }) {
    const tier = getRarityVisualTier(item.rarity)
    const candidates = useMemo(() => catalogItemImageCandidates(item), [item])
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        setAttempt(0)
    }, [item.ardbId])

    const src = attempt < candidates.length ? candidates[attempt] : undefined
    const ardbUrl = `https://ardb.app/db/items/${encodeURIComponent(item.ardbId)}`

    return (
        <article className={`group relative ${rarityCardContainerClasses(tier, 'compact')}`}>
            <div className={rarityCardTopBarClass(tier)} aria-hidden />

            <div className="flex flex-col flex-1 min-h-0 min-w-0 px-2 pt-2 pb-2 gap-1.5">
                <h2 className="text-left text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-rf-text leading-tight line-clamp-2 group-hover:text-white transition-colors">
                    {item.name}
                </h2>

                <div className="flex flex-wrap gap-1">
                    <TypeBadge type={item.itemType} />
                    {item.rarity?.trim() ? (
                        <span className="text-[8px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded border font-bold border-white/10 bg-white/[0.05] text-rf-textSoft">
                            {formatRarityLabel(item.rarity)}
                        </span>
                    ) : null}
                </div>

                <div
                    className="relative w-full aspect-[5/4] max-h-[6.5rem] sm:max-h-[7.5rem] rounded-md border border-blue-950/60 bg-[#040b18] flex items-center justify-center overflow-hidden p-0.5"
                    style={catalogGridStyle}
                >
                    <div className={`${rarityImageBackdropClass(tier)} rounded-md`} aria-hidden />
                    {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            key={`${item.ardbId}-${attempt}-${src.slice(0, 48)}`}
                            src={src}
                            alt=""
                            onError={() => setAttempt((a) => a + 1)}
                            className="relative z-[1] h-full w-full max-h-full max-w-full object-contain object-center drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)] transition-[opacity,filter] duration-200 opacity-100 group-hover:brightness-110"
                        />
                    ) : (
                        <span className="relative z-[1] text-rf-textSoft/60 text-[9px] uppercase tracking-widest">
                            No image
                        </span>
                    )}
                </div>

                <div className="mt-auto pt-1 border-t border-white/[0.06] space-y-2">
                    <div>
                        <p className="text-[9px] uppercase tracking-wider text-rf-textSoft/50 font-semibold">Lowest offer</p>
                        <p className="text-sm font-bold text-rf-textSoft/75 mt-0.5">No offers</p>
                        <p className="text-[10px] text-rf-textSoft/45 mt-0.5 leading-snug">Pricing when G2G trading goes live</p>
                    </div>
                    <Link href={ardbUrl} target="_blank" rel="noopener noreferrer" className={btnDetails}>
                        View Details
                    </Link>
                </div>
            </div>
        </article>
    )
}
