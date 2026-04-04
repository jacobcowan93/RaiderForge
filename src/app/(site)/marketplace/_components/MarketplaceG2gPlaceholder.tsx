'use client'

/**
 * G2G Integration panel displayed in the Marketplace sell tab.
 *
 * Current state: Beta placeholder — shows roadmap and integration status.
 * Phase 2: When G2G_API_KEY + G2G_SECRET_KEY are configured on the server,
 * this component will be replaced by a real G2G listings fetch via the
 * /api/marketplace/g2g-listings server action.
 *
 * Security note: G2G credentials (G2G_API_KEY, G2G_SECRET_KEY) are NEVER
 * exposed to the client. All signed requests go through server-side API routes
 * only. See src/config/env.ts and docs/g2g-integration.md for setup.
 */

export function MarketplaceG2gPlaceholder() {
    const steps = [
        { done: true,  label: 'Native community listing system live' },
        { done: true,  label: 'G2G API types, webhooks, and auth scaffolding' },
        { done: true,  label: 'AI listing optimizer (G2G offer format output)' },
        { done: false, label: 'G2G catalog fetch + ARC Raiders item matching' },
        { done: false, label: 'Auto-listing sync (post RaiderForge → G2G)' },
        { done: false, label: 'Full escrow, buyer protection, order tracking' },
    ]

    return (
        <div
            className="relative overflow-hidden rounded-2xl border border-rf-cyan/25 bg-gradient-to-br from-[#0d1a28]/90 to-[#050810]/90 p-5"
            style={{ boxShadow: '0 0 0 1px rgba(34,211,238,0.12), 0 0 40px -8px rgba(34,211,238,0.18), 0 8px 32px rgba(0,0,0,0.55)' }}
        >
            {/* Subtle ambient glow */}
            <div className="pointer-events-none absolute -top-8 -left-8 h-40 w-40 rounded-full bg-rf-cyan/[0.06] blur-3xl" aria-hidden />

            {/* Header row */}
            <div className="flex flex-wrap items-start gap-3 mb-4">
                <div className="shrink-0 h-9 w-9 rounded-xl bg-rf-cyan/10 border border-rf-cyan/25 flex items-center justify-center"
                    style={{ boxShadow: '0 0 12px -2px rgba(34,211,238,0.30)' }}
                >
                    {/* G2G-style shield/lock icon */}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="text-rf-cyan" aria-hidden>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-rf-cyan/80">
                            G2G Integration
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-md border border-rf-cyan/30 bg-rf-cyan/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-rf-cyan">
                            <span className="h-1.5 w-1.5 rounded-full bg-rf-cyan animate-pulse" aria-hidden />
                            In Progress
                        </span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">
                        Official G2G API — Secure Escrow Coming Soon
                    </h3>
                </div>
            </div>

            <p className="text-sm text-white/68 leading-relaxed mb-4">
                We are building a full two-way G2G integration — ARC Raiders items listed on RaiderForge will
                sync automatically to G2G, with{' '}
                <strong className="text-white/85 font-semibold">official escrow, buyer protection, and managed checkout</strong>.
                Community listings are already live now. G2G-backed secure trading is the next step.
            </p>

            {/* Roadmap checklist */}
            <ul className="space-y-2 mb-4" aria-label="G2G integration roadmap">
                {steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs">
                        <span
                            className={`shrink-0 h-4 w-4 rounded-full border flex items-center justify-center ${
                                step.done
                                    ? 'border-rf-cyan/60 bg-rf-cyan/15'
                                    : 'border-white/20 bg-white/[0.04]'
                            }`}
                            style={step.done ? { boxShadow: '0 0 6px rgba(34,211,238,0.35)' } : undefined}
                            aria-hidden
                        >
                            {step.done ? (
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}
                                    strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-rf-cyan">
                                    <path d="M2 6l3 3 5-5" />
                                </svg>
                            ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                            )}
                        </span>
                        <span className={step.done ? 'text-white/80' : 'text-white/42'}>{step.label}</span>
                    </li>
                ))}
            </ul>

            {/* Status pill */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-lg bg-black/40 border border-rf-cyan/15 px-3 py-1.5 text-[11px] text-white/55">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                    Native community listings active now
                </div>
                <a
                    href="https://docs.g2g.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-rf-cyan/60 hover:text-rf-cyan transition-colors underline underline-offset-2"
                >
                    G2G OpenAPI docs
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 9.5l7-7M4 2.5h5.5V8" />
                    </svg>
                </a>
            </div>
        </div>
    )
}
