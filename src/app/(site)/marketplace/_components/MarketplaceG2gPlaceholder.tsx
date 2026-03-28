'use client'

/**
 * Placeholder only — no G2G credentials or OAuth in client bundles.
 * Real trading integration pending legal / API review (docs.g2g.com).
 */

export function MarketplaceG2gPlaceholder() {
    return (
        <div className="rf-card rounded-xl border border-dashed border-white/15 bg-black/25 px-4 py-3 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rf-textSoft/70">G2G trading (planned)</p>
            <p className="text-[11px] text-rf-textSoft/65 leading-relaxed">
                Checkout and buyer protection via G2G are not wired yet. Native listings below are experimental — do not
                expose API keys in the browser when we integrate.
            </p>
            <button
                type="button"
                disabled
                className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-rf-textSoft/40 cursor-not-allowed"
            >
                Sign in with G2G — coming soon
            </button>
        </div>
    )
}
