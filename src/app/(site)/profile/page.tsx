'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/UserContext'

type BlueprintSyncSummary = {
    available: boolean
    total: number
    owned: number
    missing: number
    percent: number
}

type AccountSummaryResponse = {
    linkedProviders: string[]
    blueprintSync: BlueprintSyncSummary
}

const linkBtn =
    'inline-flex items-center justify-center rounded-lg border border-rf-border bg-rf-bg/70 px-4 py-2.5 text-sm font-medium text-rf-text hover:text-white hover:border-rf-red/35 transition-colors'

export default function ProfilePage() {
    const { user, status } = useAuth()
    const [summary, setSummary] = useState<AccountSummaryResponse | null>(null)
    const [summaryError, setSummaryError] = useState<string | null>(null)

    const loadSummary = useCallback(async () => {
        if (!user?.id) return
        setSummaryError(null)
        try {
            const res = await fetch('/api/user/account-summary', { credentials: 'same-origin' })
            if (res.status === 401) {
                setSummary(null)
                return
            }
            if (!res.ok) {
                setSummaryError('Could not load account summary.')
                setSummary(null)
                return
            }
            const data = (await res.json()) as AccountSummaryResponse
            if (data.blueprintSync && Array.isArray(data.linkedProviders)) {
                setSummary(data)
            } else {
                setSummaryError('Unexpected response from server.')
            }
        } catch {
            setSummaryError('Could not load account summary.')
            setSummary(null)
        }
    }, [user?.id])

    useEffect(() => {
        if (status === 'authenticated' && user?.id) {
            void loadSummary()
        }
        if (status === 'unauthenticated') {
            setSummary(null)
            setSummaryError(null)
        }
    }, [status, user?.id, loadSummary])

    if (status === 'loading') {
        return (
            <div className="py-12 px-6 max-w-3xl mx-auto">
                <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-4" />
                <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
            </div>
        )
    }

    if (!user) {
        return (
            <div className="py-16 px-6 max-w-3xl mx-auto text-center">
                <h2 className="text-2xl font-bold text-white mb-3">Account</h2>
                <p className="text-rf-textSoft mb-2 max-w-md mx-auto leading-relaxed">
                    Sign in to see your RaiderForge profile, linked sign-in methods, and blueprint collection progress — all synced across devices when the server is configured for it.
                </p>
                <p className="text-xs text-white/35 mb-8">
                    Without an account, blueprint progress stays in this browser only.
                </p>
                <button
                    type="button"
                    onClick={() => signIn()}
                    className="rounded-md bg-rf-red px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rf-red/40 hover:bg-rf-redSoft transition-colors"
                >
                    Sign In
                </button>
            </div>
        )
    }

    const bp = summary?.blueprintSync

    return (
        <div className="py-10 px-6 max-w-3xl mx-auto">
            <header className="mb-8">
                <span className="text-xs uppercase tracking-widest text-rf-red font-semibold">Dashboard</span>
                <h1 className="mt-2 text-3xl font-bold text-white">Your account</h1>
                <p className="mt-1 text-sm text-rf-textSoft">
                    Identity, sign-in methods, and blueprint tracker.
                </p>
            </header>

            {/* Identity */}
            <section className="rf-card rounded-xl p-6 mb-5 border border-white/[0.06]">
                <h2 className="text-xs uppercase tracking-widest text-rf-textSoft font-semibold mb-4">Signed in as</h2>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.image}
                            alt=""
                            className="h-16 w-16 rounded-full ring-2 ring-rf-red/35 shrink-0"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-rf-red/20 flex items-center justify-center text-2xl font-bold text-rf-red shrink-0">
                            {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white text-lg truncate">{user.name ?? 'Raider'}</p>
                        {user.email ? (
                            <p className="text-sm text-rf-textSoft truncate mt-0.5">{user.email}</p>
                        ) : (
                            <p className="text-sm text-rf-textSoft/80 mt-0.5">No email on file for this sign-in method.</p>
                        )}
                        {summary?.linkedProviders && summary.linkedProviders.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {summary.linkedProviders.map((p) => (
                                    <span
                                        key={p}
                                        className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md border border-white/10 bg-white/[0.04] text-rf-textSoft"
                                    >
                                        {p}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-white/35 mt-3">Linked sign-in methods will appear here when available.</p>
                        )}
                        {bp?.available ? (
                            <p className="text-xs text-emerald-400/90 mt-3 leading-relaxed">
                                Blueprint collection is synced to this RaiderForge account (database-backed).
                            </p>
                        ) : (
                            <p className="text-xs text-rf-textSoft/80 mt-3 leading-relaxed">
                                Blueprint cloud sync needs a configured database on the server. Your tracker can still use this
                                browser&apos;s local storage.
                            </p>
                        )}
                    </div>
                </div>
            </section>

            {/* Blueprint progress */}
            <section className="rf-card rounded-xl p-6 mb-5 border border-white/[0.06]">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-xs uppercase tracking-widest text-rf-textSoft font-semibold">Blueprint tracker</h2>
                    <Link href="/blueprints" className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                        Open tracker →
                    </Link>
                </div>
                {summaryError ? (
                    <p className="text-sm text-rf-red/90">{summaryError}</p>
                ) : !bp ? (
                    <div className="animate-pulse space-y-2 py-2">
                        <div className="h-4 bg-white/10 rounded w-2/3" />
                        <div className="h-2 bg-white/5 rounded w-full" />
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm tabular-nums">
                            <span className="text-rf-textSoft">
                                Owned <span className="text-rf-green font-semibold text-white">{bp.owned}</span>
                                <span className="text-white/30"> / </span>
                                <span className="text-white/80">{bp.total}</span>
                            </span>
                            <span className="text-rf-textSoft">
                                Missing <span className="text-rf-orange font-medium">{bp.missing}</span>
                            </span>
                            <span className="text-rf-textSoft">
                                Complete <span className="text-white font-medium">{bp.percent}%</span>
                            </span>
                        </div>
                        <div
                            className="mt-4 h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={bp.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-rf-green/85 to-emerald-400/90 transition-[width] duration-500"
                                style={{ width: `${bp.percent}%` }}
                            />
                        </div>
                        <p className="text-[11px] text-white/35 mt-3 leading-relaxed">
                            Totals follow the blueprint allowlist ({bp.total} items). Open the tracker to edit ownership; changes
                            sync to your account when cloud sync is enabled.
                        </p>
                    </>
                )}
            </section>

            {/* Quick navigation */}
            <section className="rf-card rounded-xl p-6 mb-6 border border-white/[0.06]">
                <h2 className="text-xs uppercase tracking-widest text-rf-textSoft font-semibold mb-3">Go to</h2>
                <div className="flex flex-wrap gap-2">
                    <Link href="/blueprints" className={linkBtn}>
                        Blueprints
                    </Link>
                    <Link href="/skill-trees" className={linkBtn}>
                        Skill Trees
                    </Link>
                </div>
            </section>

            {/* MetaForge / future sync — compact */}
            <section className="rounded-xl border border-rf-border/60 bg-rf-bgSoft/20 px-5 py-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs font-semibold uppercase tracking-wider text-rf-textSoft">Embark / MetaForge sync</p>
                    <span className="text-[10px] rounded-full border border-rf-yellow/30 bg-rf-yellow/10 text-rf-yellow px-2 py-0.5 font-medium">
                        Coming soon
                    </span>
                </div>
                <p className="text-xs text-rf-textSoft/80 mt-2 leading-relaxed">
                    Workshop, quests, and inventory sync with Embark is on the roadmap — separate from blueprint tracker sync
                    above.
                </p>
                <a
                    href="https://metaforge.app/arc-raiders/raider-profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-rf-blue hover:text-white transition-colors"
                >
                    Learn more at MetaForge
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                </a>
            </section>
        </div>
    )
}
