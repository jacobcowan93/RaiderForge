import type { Metadata } from 'next'
import Image from 'next/image'
import { normalizePublicAssetUrl } from '@/lib/site/publicAssetUrl'
import { checkG2gConfigured } from './actions'

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
 * Marketplace section layout — immersive background image with amber safety notice.
 * The amber banner (role="note") is always server-rendered and visible above all content.
 */
export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
    const g2gConnected = await checkG2gConfigured()

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
                        className="relative rounded-xl border border-amber-400/70 bg-amber-950/95 backdrop-blur-md overflow-hidden"
                        style={{ boxShadow: '0 0 0 1px rgba(217,119,6,0.55), 0 0 40px -4px rgba(217,119,6,0.60), 0 8px 32px rgba(0,0,0,0.70)' }}
                    >
                        {/* G2G integration badge row */}
                        <div className="flex items-center gap-2 border-b border-amber-500/25 px-4 py-2 flex-wrap">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden="true" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
                                Community Marketplace (Beta) · G2G Integration In Progress
                            </span>

                            {/* G2G Connected — only rendered when API keys are present server-side */}
                            {g2gConnected && (
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/50 bg-emerald-500/12 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300"
                                    style={{ boxShadow: '0 0 8px rgba(52,211,153,0.30), 0 0 20px rgba(52,211,153,0.12)' }}
                                    title="G2G API keys loaded — integration active"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" aria-hidden="true" />
                                    G2G Connected
                                </span>
                            )}

                            <span className="ml-auto shrink-0 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-300">
                                Beta
                            </span>
                        </div>

                        {/* Main body */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 px-4 py-3 text-[11px] text-amber-100/90 leading-relaxed">
                            {/* Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-amber-400 shrink-0 self-start sm:self-auto" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                            </svg>

                            {/* Body text */}
                            <span className="flex-1">
                                Listings are community-generated. Use at your own risk — we do not guarantee delivery or facilitate real-money transactions.{' '}
                                <strong className="text-amber-200 font-semibold">Full escrow and secure trading coming soon via official G2G API.</strong>{' '}
                                Not affiliated with Embark Studios or G2G.
                            </span>

                            {/* Links */}
                            <div className="flex items-center gap-3 shrink-0">
                                <a href="/terms" className="underline underline-offset-2 text-amber-300/85 hover:text-amber-200 transition-colors font-semibold whitespace-nowrap">
                                    Terms
                                </a>
                                <a href="/privacy" className="underline underline-offset-2 text-amber-300/85 hover:text-amber-200 transition-colors font-semibold whitespace-nowrap">
                                    Privacy
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                {children}
            </div>
        </div>
    )
}
