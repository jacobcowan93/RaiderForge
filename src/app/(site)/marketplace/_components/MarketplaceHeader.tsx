import { PageMaturityBadge } from '@/components/PageMaturityBadge'

export function MarketplaceHeader() {
    return (
        <header className="rf-card rounded-2xl px-6 py-6 border border-white/10 bg-black/60 backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tighter text-white">
                            Market<span className="text-yellow-400">place</span>
                        </h1>
                        <PageMaturityBadge level="beta" />
                    </div>
                    <p className="mt-1 text-sm text-white/60 max-w-lg">
                        Browse real listings · List your gear with AI help ·{' '}
                        G2G-powered secure trading &amp; buyer protection coming soon
                    </p>
                </div>

                {/* Trust signals */}
                <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                    </div>
                    <div className="flex items-center gap-1 text-white/70">
                        <span className="font-semibold">AI Optimizer</span>
                        <span className="rounded bg-yellow-400/10 px-2 py-px text-yellow-300 text-[10px] font-bold">NEW</span>
                    </div>
                </div>
            </div>
        </header>
    )
}
