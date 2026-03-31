import Link from 'next/link'
import { ARDB_CATALOG_ATTRIBUTION } from '@/lib/marketplace/catalog-types'

export function MarketplaceFooterCredits() {
    return (
        <footer className="mt-24 border-t border-white/10 pt-8 text-xs text-white/40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <p className="font-medium text-white/70">RaiderForge Marketplace</p>
                    <p className="mt-1 leading-relaxed">
                        Native listings are live today. If enabled in a later release, checkout, escrow, and buyer-protection
                        flows may be powered by the{' '}
                        <a
                            href="https://docs.g2g.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-white/80 transition-colors"
                        >
                            G2G Public API
                        </a>.
                    </p>
                    <p className="mt-1 leading-relaxed">
                        Item catalog data from{' '}
                        <Link
                            href={ARDB_CATALOG_ATTRIBUTION.providerUrl}
                            className="underline hover:text-white/80 transition-colors"
                        >
                            {ARDB_CATALOG_ATTRIBUTION.providerUrl.replace(/^https?:\/\//, '')}
                        </Link>
                        {' '}— {ARDB_CATALOG_ATTRIBUTION.disclaimer}
                    </p>
                </div>

                <div className="text-right text-[10px] leading-tight shrink-0">
                    <p>Not affiliated with Embark Studios</p>
                    <p className="mt-px">Marketplace infrastructure inspired by G2G</p>
                    <p className="mt-px">© RaiderForge · Community project</p>
                </div>
            </div>
        </footer>
    )
}
