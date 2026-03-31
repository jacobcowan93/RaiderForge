'use client'

export function MarketplaceG2gPlaceholder() {
    return (
        <div className="rf-card rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-950/30 to-black/60 p-6">
            <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/30">
                        <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-yellow-400"
                            aria-hidden
                        >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <p className="uppercase tracking-[0.125em] text-xs font-bold text-yellow-400/80">
                            G2G Checkout Integration · Planned
                        </p>
                        <h3 className="text-lg font-semibold text-white mt-1">
                            Native listings are already live on RaiderForge
                        </h3>
                    </div>

                    <p className="text-sm text-white/70 leading-relaxed">
                        Signed-in users can post and manage listings today. A future G2G integration could add
                        managed checkout, escrow, buyer-protection flows, and dispute handling without changing
                        the current listing system.
                    </p>

                    <div className="inline-flex items-center gap-2 rounded-lg bg-black/60 border border-white/10 px-4 py-2 text-xs text-white/60">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Native listings are active
                    </div>
                </div>
            </div>
        </div>
    )
}
