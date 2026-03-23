'use client'

import { signIn } from 'next-auth/react'
import { useAuth } from '../../context/UserContext'

export default function ProfilePage() {
    const { user, status } = useAuth()

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
                <h2 className="text-2xl font-bold text-white mb-3">Raider Profile</h2>
                <p className="text-rf-textSoft mb-8">Sign in to access your RaiderForge profile.</p>
                <button
                    onClick={() => signIn()}
                    className="rounded-md bg-rf-red px-6 py-3 text-sm font-semibold text-white shadow-md shadow-rf-red/40 hover:bg-rf-redSoft transition-colors"
                >
                    Sign In
                </button>
            </div>
        )
    }

    return (
        <div className="py-12 px-6 max-w-3xl mx-auto">
            <div className="mb-8">
                <span className="text-xs uppercase tracking-widest text-rf-red font-semibold">Your Account</span>
                <h1 className="mt-2 text-3xl font-bold text-white">Raider Profile</h1>
            </div>

            {/* ── Raider Identity ── */}
            <section className="rf-card rounded-xl p-6 mb-6">
                <h2 className="text-xs uppercase tracking-widest text-rf-textSoft font-semibold mb-4">Raider Identity</h2>
                <div className="flex items-center gap-4">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt="avatar"
                            className="h-14 w-14 rounded-full ring-2 ring-rf-red/40"
                        />
                    ) : (
                        <div className="h-14 w-14 rounded-full bg-rf-red/20 flex items-center justify-center text-xl font-bold text-rf-red">
                            {user.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-white text-lg">{user.name ?? 'Unknown Raider'}</p>
                        <p className="text-sm text-rf-textSoft">{user.email}</p>
                        <p className="text-xs text-white/30 mt-0.5">Signed in via Discord / Google</p>
                    </div>
                </div>
            </section>

            {/* ── Raider Profile Sync ── */}
            <section className="rf-card rounded-xl p-6 mb-6 border border-rf-border/60">
                <div className="flex items-start justify-between mb-1">
                    <h2 className="text-xs uppercase tracking-widest text-rf-textSoft font-semibold">Raider Profile Sync</h2>
                    <span className="text-[10px] rounded-full border border-rf-yellow/30 bg-rf-yellow/10 text-rf-yellow px-2 py-0.5 font-medium">
                        Coming Soon
                    </span>
                </div>
                <p className="text-sm text-rf-textSoft mt-3 leading-relaxed">
                    Connect your Embark account to track your workshop progression, quest completion,
                    project advancement, blueprint collection, inventory, and raid history — all inside
                    RaiderForge.
                </p>

                <div className="mt-5 space-y-3">
                    {[
                        { label: 'Workshop Progression',  status: 'Requires sync' },
                        { label: 'Quest Completion',      status: 'Requires sync' },
                        { label: 'Blueprint Collection',  status: 'Requires sync' },
                        { label: 'Inventory',             status: 'Requires sync' },
                        { label: 'Raid History',          status: 'Requires sync' },
                        { label: 'Player Stats',          status: 'Requires sync' },
                    ].map(({ label, status: s }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-sm text-white/60">{label}</span>
                            <span className="text-xs text-white/25">{s}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-5 pt-4 border-t border-white/5 text-xs text-rf-textSoft/50 leading-relaxed">
                    Full Raider Profile Sync requires a verified authenticated integration path with
                    MetaForge or Embark. This integration is on the RaiderForge roadmap and will be
                    enabled when the path is verified and documented.
                </div>

                <a
                    href="https://metaforge.app/arc-raiders/raider-profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs text-rf-blue hover:text-white transition-colors"
                >
                    Learn more at MetaForge
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                </a>
            </section>

            {/* ── Quick Links ── */}
            <section className="rf-card rounded-xl p-6">
                <h2 className="text-xs uppercase tracking-widest text-rf-textSoft font-semibold mb-4">Quick Access</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                        { label: 'Blueprint Tracker', href: '/blueprints' },
                        { label: 'Interactive Map', href: '/maps' },
                        { label: 'Strategy Guides', href: '/guides' },
                        { label: 'Builds', href: '/builds' },
                        { label: 'Marketplace', href: '/marketplace' },
                    ].map(({ label, href }) => (
                        <a
                            key={href}
                            href={href}
                            className="rounded-lg border border-rf-border bg-rf-bg/60 px-3 py-2.5 text-xs text-rf-textSoft hover:text-white hover:border-rf-red/30 transition-all text-center"
                        >
                            {label}
                        </a>
                    ))}
                </div>
            </section>
        </div>
    )
}
