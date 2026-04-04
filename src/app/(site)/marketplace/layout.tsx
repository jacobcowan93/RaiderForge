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
            <div className="relative z-[6]">
                {/* ── Safety & transparency notice — always server-rendered ── */}
                <div className="mx-auto max-w-7xl px-4 pt-4">
                    <div
                        role="note"
                        aria-label="Community marketplace disclaimer"
                        className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border border-amber-400/70 bg-amber-950/95 px-4 py-3.5 text-[11px] text-amber-100/90 leading-relaxed backdrop-blur-md"
                        style={{ boxShadow: '0 0 0 1px rgba(217,119,6,0.50), 0 0 32px -4px rgba(217,119,6,0.55), 0 6px 24px rgba(0,0,0,0.65)' }}
                    >
                        {/* Icon + label */}
                        <div className="flex items-center gap-2 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-400 shrink-0" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                            </svg>
                            <span className="font-bold text-amber-300 text-[11px] uppercase tracking-widest">Community Marketplace</span>
                        </div>

                        {/* Divider on sm+ */}
                        <span className="hidden sm:block h-4 w-px bg-amber-500/30 shrink-0" aria-hidden="true" />

                        {/* Body */}
                        <span className="flex-1">
                            RaiderForge is an independent fan project — we do not facilitate real-money transactions or guarantee delivery.
                            Listings are player-generated. Trade safely and verify with sellers.{' '}
                            <strong className="text-amber-200/90 font-medium">Not affiliated with Embark Studios.</strong>
                        </span>

                        {/* Links */}
                        <div className="flex items-center gap-3 shrink-0">
                            <a href="/terms" className="underline underline-offset-2 text-amber-300/80 hover:text-amber-200 transition-colors font-medium">
                                Terms
                            </a>
                            <a href="/privacy" className="underline underline-offset-2 text-amber-300/80 hover:text-amber-200 transition-colors font-medium">
                                Privacy
                            </a>
                        </div>
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}
