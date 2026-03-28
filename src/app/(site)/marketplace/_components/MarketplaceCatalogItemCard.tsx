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
    'inline-flex w-full items-center justify-center rounded-lg border border-rf-red/35 bg-rf-bg/80 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-rf-red hover:border-rf-red/55 hover:bg-rf-red/10 hover:text-rf-red transition-colors'

export function MarketplaceCatalogItemCard({ item }: { item: MarketplaceCatalogItem }) {
    const tier = getRarityVisualTier(item.rarity)
    const candidates = useMemo(() => catalogItemImageCandidates(item), [item])
    const [attempt, setAttempt] = useState(0)
    const [imgLoaded, setImgLoaded] = useState(false)

    useEffect(() => {
        setAttempt(0)
    }, [item.ardbId])

    const src = attempt < candidates.length ? candidates[attempt] : undefined

    useEffect(() => {
        setImgLoaded(false)
    }, [src])
    const ardbUrl = `https://ardb.app/db/items/${encodeURIComponent(item.ardbId)}`

    return (
        <article className={`group relative ${rarityCardContainerClasses(tier, 'compact')}`}>
            <div className={rarityCardTopBarClass(tier)} aria-hidden />

            <div className="flex flex-col flex-1 min-h-0 min-w-0 px-1.5 pt-1.5 pb-1.5 gap-1">
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
                    className="relative w-full aspect-[5/4] max-h-[6.25rem] sm:max-h-[7.25rem] rounded-md border border-blue-950/60 bg-[#040b18] flex items-center justify-center overflow-hidden p-0.5"
                    style={catalogGridStyle}
                >
                    <div className={`${rarityImageBackdropClass(tier)} rounded-md`} aria-hidden />
                    {src ? (
                        <>
                            {!imgLoaded ? (
                                <div
                                    className="absolute inset-[2px] z-[1] rounded-md bg-[#0c1424] animate-pulse border border-white/[0.05]"
                                    aria-hidden
                                />
                            ) : null}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                key={`${item.ardbId}-${attempt}-${src.slice(0, 48)}`}
                                src={src}
                                alt=""
                                onError={() => setAttempt((a) => a + 1)}
                                onLoad={() => setImgLoaded(true)}
                                className={`relative z-[2] h-full w-full max-h-full max-w-full object-contain object-center drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)] transition-[opacity,filter] duration-200 group-hover:brightness-110 ${
                                    imgLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                        </>
                    ) : (
                        <span className="relative z-[1] text-rf-textSoft/60 text-[9px] uppercase tracking-widest">
                            No image
                        </span>
                    )}
                </div>

                <div className="mt-auto pt-0.5 border-t border-white/[0.06] space-y-1.5">
                    <div>
                        <p className="text-[9px] uppercase tracking-wider text-rf-textSoft/50 font-semibold">Offer status</p>
                        <p className="text-xs font-bold text-rf-textSoft/85 mt-0.5 leading-tight">No active listings</p>
                        <p className="text-[10px] text-rf-textSoft/48 mt-0.5 leading-snug">
                            Reference catalog only — live offers queue behind G2G trading integration.
                        </p>
                    </div>
                    <Link href={ardbUrl} target="_blank" rel="noopener noreferrer" className={btnDetails}>
                        View Details
                    </Link>
                </div>
            </div>
        </article>
    )
}
