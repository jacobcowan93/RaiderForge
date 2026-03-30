import Image from 'next/image'
import { normalizePublicAssetUrl } from '@/lib/site/publicAssetUrl'

/**
 * Marketplace section — same full-viewport background as Maps (skill tree art + light tint).
 */
export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
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
            <div className="relative z-[6]">{children}</div>
        </div>
    )
}
