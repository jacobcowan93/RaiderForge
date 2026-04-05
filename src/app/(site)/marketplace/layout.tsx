import type { Metadata } from 'next'
import Image from 'next/image'
import { normalizePublicAssetUrl } from '@/lib/site/publicAssetUrl'

export const metadata: Metadata = {
    title: 'Marketplace — Buy & Sell ARC Raiders Items',
    description:
        'Browse ARC Raiders community listings, post your own gear for sale, and use the AI-powered listing optimizer to write compelling buyer-ready titles, tags, and descriptions. Community-run marketplace — not affiliated with Embark Studios.',
    keywords: ['ARC Raiders marketplace', 'ARC Raiders items', 'ARC Raiders trade', 'buy ARC Raiders gear', 'sell ARC Raiders items'],
    openGraph: {
        title: 'ARC Raiders Marketplace | RaiderForge',
        description: 'Browse listings, sell gear, and use the AI listing optimizer. Community marketplace for ARC Raiders players.',
        url: 'https://raiderforge.org/marketplace',
    },
    alternates: { canonical: 'https://raiderforge.org/marketplace' },
}

/**
 * Marketplace section layout — immersive background image with transparency notice.
 * The amber banner (role="note") is always server-rendered and visible above all content.
 */
export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-[100dvh]">
            <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden>
                <Image
                    src={normalizePublicAssetUrl('/images/ARC_Marketplace.jpg')}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                    priority
                />
            </div>
            <div className="pointer-events-none fixed inset-0 z-[5] bg-black/60" aria-hidden="true" />
            <div className="relative z-[6]">
                {children}
            </div>
        </div>
    )
}
