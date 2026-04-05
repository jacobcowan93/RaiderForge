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

import { useState } from 'react'
import { testG2gConnection, type G2GConnectionResult } from '../actions'

export function MarketplaceG2gPlaceholder() {
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<G2GConnectionResult | null>(null)

    async function handleTestConnection() {
        setTesting(true)
        setTestResult(null)
        const result = await testG2gConnection()
        setTestResult(result)
        setTesting(false)
    }
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
            className="relative overflow-hidden rounded-2xl border border-rf-orange/25 bg-gradient-to-br from-[#180f05]/90 to-[#050810]/90 p-5"
            style={{ boxShadow: '0 0 0 1px rgba(249,115,22,0.12), 0 0 40px -8px rgba(249,115,22,0.18), 0 8px 32px rgba(0,0,0,0.55)' }}
        >
            {/* Subtle ambient glow */}
            <div className="pointer-events-none absolute -top-8 -left-8 h-40 w-40 rounded-full bg-rf-orange/[0.06] blur-3xl" aria-hidden />

            {/* Header row */}
            <div className="flex flex-wrap items-start gap-3 mb-4">
                <div className="shrink-0 h-9 w-9 rounded-xl bg-rf-orange/10 border border-rf-orange/25 flex items-center justify-center"
                    style={{ boxShadow: '0 0 12px -2px rgba(249,115,22,0.30)' }}
                >
                    {/* G2G-style shield/lock icon */}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="text-rf-orange" aria-hidden>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-rf-orange/80">
                            G2G Integration
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-md border border-rf-orange/30 bg-rf-orange/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-rf-orange">
                            <span className="h-1.5 w-1.5 rounded-full bg-rf-orange animate-pulse" aria-hidden />
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
                                    ? 'border-rf-orange/60 bg-rf-orange/15'
                                    : 'border-white/20 bg-white/[0.04]'
                            }`}
                            style={step.done ? { boxShadow: '0 0 6px rgba(249,115,22,0.35)' } : undefined}
                            aria-hidden
                        >
                            {step.done ? (
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}
                                    strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-rf-orange">
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
                <div className="inline-flex items-center gap-2 rounded-lg bg-black/40 border border-rf-orange/15 px-3 py-1.5 text-[11px] text-white/55">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                    Native community listings active now
                </div>
                <a
                    href="https://docs.g2g.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-rf-orange/60 hover:text-rf-orange transition-colors underline underline-offset-2"
                >
                    G2G OpenAPI docs
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 9.5l7-7M4 2.5h5.5V8" />
                    </svg>
                </a>

                {/* Test Connection — pings G2G /v2/store via server action (keys never leave server) */}
                <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-rf-orange/30 bg-rf-orange/[0.08] px-3 py-1.5 text-[11px] font-semibold text-rf-orange/80 hover:text-rf-orange hover:border-rf-orange/55 hover:bg-rf-orange/[0.14] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 0 12px -4px rgba(249,115,22,0.20)' }}
                >
                    {testing ? (
                        <>
                            <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                                <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            Testing…
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            Test Connection
                        </>
                    )}
                </button>
            </div>

            {/* Test Connection result */}
            {testResult && (
                <div
                    className={`mt-3 rounded-xl border px-4 py-3 text-xs leading-relaxed transition-all ${
                        testResult.ok
                            ? 'border-emerald-400/35 bg-emerald-500/[0.08] text-emerald-300/90'
                            : testResult.status === 'not_configured'
                                ? 'border-amber-400/30 bg-amber-500/[0.07] text-amber-300/80'
                                : 'border-rf-red/35 bg-rf-red/[0.08] text-rf-red/90'
                    }`}
                    style={testResult.ok ? { boxShadow: '0 0 16px -4px rgba(52,211,153,0.20)' } : undefined}
                    role="status"
                    aria-live="polite"
                >
                    {testResult.ok ? (
                        <div className="space-y-1">
                            <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                                G2G API connected — keys loaded &amp; authenticated
                            </p>
                            <p className="text-emerald-300/70">
                                Seller status: <strong className="text-emerald-200">{testResult.sellerStatus}</strong>
                                {' · '}
                                Account: <strong className="text-emerald-200">{testResult.accountStatus}</strong>
                                {' · '}
                                User ID: <code className="text-emerald-200/80 font-mono">{testResult.userId}</code>
                            </p>
                        </div>
                    ) : testResult.status === 'not_configured' ? (
                        <p>
                            <strong className="text-amber-200">G2G API keys not configured.</strong>{' '}
                            Add <code className="bg-black/30 px-1 rounded font-mono">G2G_API_KEY</code>,{' '}
                            <code className="bg-black/30 px-1 rounded font-mono">G2G_SECRET_KEY</code>, and{' '}
                            <code className="bg-black/30 px-1 rounded font-mono">G2G_USERNAME</code> to your server environment.
                        </p>
                    ) : (
                        <p>
                            <strong>Connection failed:</strong>{' '}
                            {'message' in testResult ? testResult.message : 'Unknown error'}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
