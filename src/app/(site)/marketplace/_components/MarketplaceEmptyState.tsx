export function MarketplaceEmptyState({
    title,
    description,
    compact,
    onSellClick,
}: {
    title: string
    description: string
    /** Tighter vertical padding when nested inside another card. */
    compact?: boolean
    /** When provided, renders a "List an item for sale" CTA. */
    onSellClick?: () => void
}) {
    return (
        <div className={`flex flex-col items-center justify-center gap-4 ${compact ? 'py-10' : 'py-24'}`}>
            {/* Icon */}
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-yellow-400/[0.06] blur-xl scale-150" aria-hidden />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <svg
                        viewBox="0 0 24 24"
                        width="28"
                        height="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white/30"
                        aria-hidden
                    >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                </div>
            </div>

            {/* Copy */}
            <div className="text-center space-y-1.5 max-w-sm">
                <p className="text-sm font-semibold text-white/80">{title}</p>
                <p className="text-xs text-white/45 leading-relaxed">{description}</p>
            </div>

            {/* CTA */}
            {onSellClick && (
                <button
                    type="button"
                    onClick={onSellClick}
                    className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 active:scale-[0.97] text-black text-xs font-bold px-5 py-2.5 transition-all duration-150 shadow-lg shadow-yellow-900/30"
                >
                    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden>
                        <path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z" />
                    </svg>
                    List an item for sale
                </button>
            )}
        </div>
    )
}
