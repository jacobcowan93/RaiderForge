import Link from 'next/link'
import { HeroBackgroundVideo } from '@/components/HeroBackgroundVideo'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { SITE_MAIN_HERO_PULL_CLASS, SITE_MAIN_TOP_PAD_CLASS } from '@/components/SiteMain'

export default function Home() {
    return (
        <>
            <div>
                <section className={`relative ${SITE_MAIN_HERO_PULL_CLASS} h-screen overflow-hidden`}>
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: "url('/images/header/ARC_Header.jpeg')" }}
                    />
                    <HeroBackgroundVideo poster="/images/header/ARC_Header.jpeg" src="/images/ARC_Home.mp4" />

                    <div className={`relative z-10 flex h-full flex-col items-center justify-center px-4 text-center ${SITE_MAIN_TOP_PAD_CLASS}`}>
                        <span
                            className="hero-enter text-shadow-hero inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold mb-4"
                            style={{ animationDelay: '0.05s' }}
                        >
                            <span className="h-px w-6 bg-[#f97316]" />
                            <span className="tracking-widest" style={{ color: '#22c55e' }}>
                                Tactical Hub
                            </span>
                            <span className="h-px w-6 bg-[#f97316]" />
                        </span>

                        <h1
                            className="hero-enter text-shadow-hero text-5xl font-black tracking-tight sm:text-7xl leading-none"
                            style={{ animationDelay: '0.18s' }}
                        >
                            <span className="text-white">Raider</span>
                            <span className="text-rf-redSoft">Forge</span>
                        </h1>

                        <p
                            className="hero-enter text-shadow-hero mt-6 max-w-lg text-sm sm:text-base font-medium text-white/85 leading-relaxed"
                            style={{ animationDelay: '0.32s' }}
                        >
                            Honest ARC Raiders companion hub: live maps and MetaForge conditions today — more systems shipping next.
                        </p>

                        <div
                            className="hero-enter mt-8 flex flex-col items-center gap-4 sm:gap-3"
                            style={{ animationDelay: '0.42s' }}
                        >
                            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-lg sm:max-w-none sm:w-auto">
                                <Link
                                    href="/maps"
                                    className="inline-flex w-full sm:w-auto justify-center items-center rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm sm:text-base font-bold px-8 py-3.5 sm:px-10 sm:py-4 border border-red-400/30 shadow-lg shadow-red-950/40 transition-colors"
                                >
                                    Enter Maps Command Center
                                </Link>
                                <Link
                                    href="/trials"
                                    className="inline-flex w-full sm:w-auto justify-center items-center rounded-xl border border-white/20 bg-black/20 hover:bg-white/10 text-white text-sm sm:text-base font-bold px-8 py-3.5 sm:px-10 sm:py-4 backdrop-blur-sm transition-colors"
                                >
                                    Weekly Trials briefing
                                </Link>
                            </div>
                            <p className="text-xs sm:text-sm text-white/50 max-w-md leading-relaxed">
                                Start with maps for live zones — or jump into this week&apos;s rotation, max-score tips, and reset
                                countdown.
                            </p>
                        </div>
                    </div>

                    <a
                        href="#features"
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-xs text-rf-textSoft/35 hover:text-rf-textSoft transition-colors"
                    >
                        <span>Scroll</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 animate-bounce"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </a>
                </section>

                <section id="features" className="py-16 px-6 bg-rf-bgSoft border-t border-white/[0.04]">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-red-500/80 font-bold text-center mb-2">
                            Field kit
                        </p>
                        <h2 className="text-center text-xl sm:text-2xl font-bold text-white mb-10 text-shadow-hero">
                            What you can use today
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Weekly Trials — Live */}
                            <Link
                                href="/trials"
                                className="group flex flex-col rounded-xl border border-red-500/25 bg-gradient-to-b from-rose-950/25 to-black/40 p-6
                                           hover:border-red-500/45 hover:shadow-[0_0_40px_-12px_rgba(239,68,68,0.35)] transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[10px] uppercase tracking-widest font-semibold text-red-400/90">
                                        Weekly Trials
                                    </span>
                                    <PageMaturityBadge level="live" />
                                </div>
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/25">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Trials command center</h3>
                                <p className="text-sm text-white/65 leading-relaxed flex-1">
                                    This week and next week rotations, max points, how-to-max tips, reset countdown, and the full
                                    filterable catalog.
                                </p>
                                <span className="mt-5 inline-flex items-center justify-center rounded-lg bg-red-600 group-hover:bg-red-500 text-white text-sm font-bold py-2.5 px-4 border border-red-400/25 transition-colors">
                                    Open Weekly Trials
                                </span>
                            </Link>

                            {/* Interactive Maps — Live */}
                            <Link
                                href="/maps"
                                className="group flex flex-col rounded-xl border border-red-500/30 bg-gradient-to-b from-red-950/20 to-black/40 p-6
                                           hover:border-red-500/50 hover:shadow-[0_0_40px_-12px_rgba(239,68,68,0.35)] transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[10px] uppercase tracking-widest font-semibold text-red-400/90">
                                        Interactive Maps
                                    </span>
                                    <PageMaturityBadge level="live" />
                                </div>
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/25">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Maps command center</h3>
                                <p className="text-sm text-white/65 leading-relaxed flex-1">
                                    Browse all five zones with live MetaForge conditions and direct links to detailed maps.tcno.co views
                                    (with permission).
                                </p>
                                <span className="mt-5 inline-flex items-center justify-center rounded-lg bg-red-600 group-hover:bg-red-500 text-white text-sm font-bold py-2.5 px-4 border border-red-400/25 transition-colors">
                                    Go to Maps Command Center
                                </span>
                            </Link>

                            {/* Loadout builder — Beta */}
                            <Link
                                href="/loadouts"
                                className="group flex flex-col rounded-xl border border-white/12 bg-gradient-to-b from-[#0a0f18]/90 to-black/45 p-6
                                           hover:border-rf-red/35 hover:shadow-[0_0_36px_-12px_rgba(239,68,68,0.22)] transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[10px] uppercase tracking-widest font-semibold text-rf-red/85">
                                        Loadout System
                                    </span>
                                    <PageMaturityBadge level="beta" />
                                </div>
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rf-red/10 text-rf-red/90 border border-rf-red/20">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Raid loadouts</h3>
                                <p className="text-sm text-white/60 leading-relaxed flex-1">
                                    Plan gear from the ARDB catalog, assign slots, and save builds in your browser. MetaForge event synergy
                                    is planned.
                                </p>
                                <span className="mt-5 inline-flex items-center justify-center rounded-lg bg-rf-red/90 group-hover:bg-rf-red text-white text-sm font-bold py-2.5 px-4 border border-rf-red/30 transition-colors">
                                    Open Loadout Builder
                                </span>
                            </Link>

                            {/* Blueprint tracker — Beta */}
                            <Link
                                href="/blueprints"
                                className="group flex flex-col rounded-xl border border-amber-500/25 bg-gradient-to-b from-amber-950/15 to-black/40 p-6
                                           hover:border-amber-500/45 hover:shadow-[0_0_36px_-10px_rgba(245,158,11,0.25)] transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-200/85">
                                        Blueprint Tracking
                                    </span>
                                    <PageMaturityBadge level="beta" />
                                </div>
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/12 text-amber-200/90 border border-amber-500/20">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Blueprint tracker</h3>
                                <p className="text-sm text-white/65 leading-relaxed flex-1">
                                    Track ownership against the community spreadsheet list, filter by category, and jump to ARDB for
                                    full crafting details — data from ardb.app.
                                </p>
                                <span className="mt-5 inline-flex items-center justify-center rounded-lg bg-amber-600/90 group-hover:bg-amber-500 text-white text-sm font-bold py-2.5 px-4 border border-amber-400/25 transition-colors">
                                    Open Blueprint Tracker
                                </span>
                            </Link>

                            {/* Marketplace — catalog browse; G2G planned */}
                            <Link
                                href="/marketplace"
                                className="group flex flex-col rounded-xl border border-white/12 bg-gradient-to-b from-[#0a0f18]/90 to-black/45 p-6
                                           hover:border-rf-red/35 hover:shadow-[0_0_36px_-12px_rgba(239,68,68,0.22)] transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[10px] uppercase tracking-widest font-semibold text-rf-red/85">
                                        Marketplace
                                    </span>
                                    <PageMaturityBadge level="in-development" />
                                </div>
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rf-red/10 text-rf-red/90 border border-rf-red/20">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Browse the catalog</h3>
                                <p className="text-sm text-white/60 leading-relaxed flex-1">
                                    Read-only item browser powered by ardb.app. Reputation-based trading and G2G checkout are planned.
                                </p>
                                <span className="mt-5 inline-flex items-center justify-center rounded-lg bg-rf-red/90 group-hover:bg-rf-red text-white text-sm font-bold py-2.5 px-4 border border-rf-red/30 transition-colors">
                                    Open Marketplace
                                </span>
                            </Link>

                            {/* Skill Tree Planner — beta */}
                            <Link
                                href="/skill-trees"
                                className="group flex flex-col rounded-xl border border-white/12 bg-gradient-to-b from-[#0a0f18]/90 to-black/45 p-6
                                           hover:border-rf-red/35 hover:shadow-[0_0_36px_-12px_rgba(239,68,68,0.22)] transition-all hover:-translate-y-0.5"
                            >
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <span className="text-[10px] uppercase tracking-widest font-semibold text-rf-red/85">
                                        Skill Trees
                                    </span>
                                    <PageMaturityBadge level="beta" />
                                </div>
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rf-red/10 text-rf-red/90 border border-rf-red/20">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
                                        />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Skill tree planner</h3>
                                <p className="text-sm text-white/60 leading-relaxed flex-1">
                                    Allocate expedition points across Conditioning, Mobility, and Survival. Plan your build and share it with a link.
                                </p>
                                <span className="mt-5 inline-flex items-center justify-center rounded-lg bg-rf-red/90 group-hover:bg-rf-red text-white text-sm font-bold py-2.5 px-4 border border-rf-red/30 transition-colors">
                                    Open Skill Tree Planner
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}
