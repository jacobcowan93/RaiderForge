export function MarketplaceEmptyState({
    title,
    description,
    compact,
    onSellClick,
}: {
    title: string
    description: string
    /** Tighter vertical padding when nested inside another card (e.g. catalog filters). */
    compact?: boolean
    /** When provided, renders a "List an item for sale" CTA button. */
    onSellClick?: () => void
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-3 text-white/60 ${compact ? 'py-8' : 'py-20'}`}
        >
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </svg>
            <p className="text-sm font-semibold text-white/80">{title}</p>
            <p className="text-xs text-center max-w-md leading-relaxed text-white/50">{description}</p>
            {onSellClick && (
                <button
                    type="button"
                    onClick={onSellClick}
                    className="mt-1 inline-flex items-center gap-2 rounded-lg bg-yellow-600/90 hover:bg-yellow-500 text-white text-xs font-bold px-4 py-2.5 border border-yellow-400/25 transition-colors"
                >
                    List an item for sale
                </button>
            )}
        </div>
    )
}
