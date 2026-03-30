import { PageMaturityBadge } from '@/components/PageMaturityBadge'

export function MarketplaceHeader() {
    return (
        <header className="rf-card rounded-xl px-4 py-4 sm:px-5 border border-white/[0.12] border-l-2 border-l-yellow-400/80 bg-black/40 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Market<span className="text-yellow-400">place</span>
                </h1>
                <PageMaturityBadge level="beta" />
            </div>
            <p className="mt-2 text-xs text-white/60 max-w-2xl leading-relaxed">
                Browse items • Sign in to list items for sale • Use the AI optimizer to write better listings • G2G-powered trading coming soon
            </p>
        </header>
    )
}
