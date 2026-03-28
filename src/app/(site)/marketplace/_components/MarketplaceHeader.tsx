import { PageMaturityBadge } from '@/components/PageMaturityBadge'

export function MarketplaceHeader() {
    return (
        <header className="rf-card rounded-xl px-4 py-4 sm:px-5 border border-white/[0.06] border-l-2 border-l-rf-red/70">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Market<span className="text-rf-red">place</span>
                </h1>
                <PageMaturityBadge level="in-development" />
            </div>
            <p className="mt-2 text-xs text-rf-textSoft max-w-2xl leading-relaxed">
                Browse items • Reputation-based trading coming soon
            </p>
        </header>
    )
}
