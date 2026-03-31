import type { Metadata } from 'next'
import Image from 'next/image'
import { normalizePublicAssetUrl } from '@/lib/site/publicAssetUrl'

export const metadata: Metadata = {
    title: 'Interactive Maps',
    description:
        'Explore all ARC Raiders zones with RaiderForge interactive maps, curated POIs, location filters, and live MetaForge conditions.',
    openGraph: {
        title: 'ARC Raiders Interactive Maps • RaiderForge',
        description:
            'RaiderForge interactive zone maps with curated POIs, filters, and live conditions for every ARC Raiders map.',
    },
}

/**
 * Maps section layout — full-viewport skill tree art (`public/images/ARC_Raiders_Main_SkillTree.png`)
 * plus a light uniform tint (~20% black) so copy and cards stay readable.
 *
 * Uses `next/image` so the asset is always requested through the app (avoids stale CSS-only URLs on some deploys).
 *
 * Stacking context notes:
 *   - Site layout watermark: fixed, z-0 in root stacking context
 *   - Site layout content wrapper: relative z-10 (creates stacking context)
 *   - Background image + tint: fixed z-[5] inside the z-10 context → above watermark,
 *     below all page content (z-[6])
 *   - NavBar (fixed z-50 in root) is unaffected — always above everything here
 */
export default function MapsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-[100dvh]">
            <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden>
                <Image
                    src={normalizePublicAssetUrl('/images/ARC_Raiders_Main_SkillTree.png')}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                    priority
                />
            </div>
            <div
                className="pointer-events-none fixed inset-0 z-[5] bg-black/20"
                aria-hidden="true"
            />
            <div className="relative z-[6]">
                {children}
            </div>
        </div>
    )
}
