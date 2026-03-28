export function MarketplaceEmptyState({
    title,
    description,
    compact,
}: {
    title: string
    description: string
    /** Tighter vertical padding when nested inside another card (e.g. catalog filters). */
    compact?: boolean
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-3 text-rf-textSoft/50 ${compact ? 'py-8' : 'py-20'}`}
        >
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
            </svg>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-center max-w-md leading-relaxed">{description}</p>
        </div>
    )
}
