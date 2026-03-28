/** Pulse skeleton for /maps navigation and RSC streaming. */
export function MapsHubSkeleton() {
    return (
        <div className="space-y-6 animate-pulse" aria-hidden>
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="h-11 flex-1 max-w-xl rounded-xl bg-white/[0.06]" />
                <div className="h-11 w-56 rounded-xl bg-white/[0.05]" />
            </div>
            <div>
                <div className="h-3 w-24 bg-white/10 rounded mb-3" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.04]">
                            <div className="aspect-[16/10] bg-white/[0.06]" />
                            <div className="h-10 bg-white/[0.03]" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#070a10]">
                <div className="h-48 sm:h-56 bg-white/[0.05]" />
                <div className="h-[min(72vh,920px)] bg-black/80" />
            </div>
            <div className="rounded-2xl border border-white/[0.08] h-64 bg-white/[0.04]" />
        </div>
    )
}
