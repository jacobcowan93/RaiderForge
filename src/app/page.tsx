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
                            The all-in-one ARC Raiders toolkit — live maps, skill planner, loadouts, blueprints, and a live marketplace with AI-powered listing tools.
                        </p>

                        <div
                            className="hero-enter mt-8 flex flex-col items-center gap-4 sm:gap-3"
                            style={{ animationDelay: '0.42s' }}
                        >
                            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-lg sm:max-w-none sm:w-auto">
                                <Link
                                    href="/blueprints"
                                    className="inline-flex w-full sm:w-auto justify-center items-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm sm:text-base font-bold px-8 py-3.5 sm:px-10 sm:py-4 border border-blue-400/30 shadow-lg shadow-blue-950/40 transition-colors"
                                >
                                    Blueprint Tracker
                                </Link>
                                <Link
                                    href="/marketplace"
                                    className="inline-flex w-full sm:w-auto justify-center items-center rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-sm sm:text-base font-bold px-8 py-3.5 sm:px-10 sm:py-4 border border-yellow-300/30 shadow-lg shadow-yellow-950/40 transition-colors"
                                >
                                    Marketplace
                                </Link>
                            </div>
                            <p className="text-xs sm:text-sm text-white/60 max-w-md leading-relaxed">
                                Track your blueprints — or browse and list items in the marketplace.
                            </p>
                            <p className="text-xs text-white/40">
                                Already playing?{' '}
                                <Link href="/sync" className="text-yellow-400/80 underline underline-offset-2 hover:text-yellow-400 transition-colors">
                                    Sync your profile
                                </Link>{' '}
                                to auto-track blueprints &amp; progress.
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

                        <div className="flex flex-col gap-3 max-w-3xl mx-auto">

                            {/* Weekly Trials — RED */}
                            <Link
                                href="/trials"
                                className="group flex items-center gap-5 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/30 to-black/50 px-5 py-4
                                           hover:border-red-500/55 hover:shadow-[0_0_30px_-10px_rgba(239,68,68,0.40)] transition-all hover:-translate-y-px"
                            >
                                <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] uppercase tracking-widest font-semibold text-red-400">Weekly Trials</span>
                                        <PageMaturityBadge level="live" />
                                    </div>
                                    <p className="text-sm text-white/60 leading-snug truncate">This week's rotations, max-score tips, reset countdown, and the full filterable catalog.</p>
                                </div>
                                <span className="shrink-0 inline-flex items-center justify-center rounded-lg bg-red-600 group-hover:bg-red-500 text-white text-xs font-bold py-2 px-4 border border-red-400/30 transition-colors">
                                    Open
                                </span>
                            </Link>

                            {/* Interactive Maps — BLUE */}
                            <Link
                                href="/maps"
                                className="group flex items-center gap-5 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-black/50 px-5 py-4
                                           hover:border-blue-500/55 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.35)] transition-all hover:-translate-y-px"
                            >
                                <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] uppercase tracking-widest font-semibold text-blue-400">Interactive Maps</span>
                                        <PageMaturityBadge level="live" />
                                    </div>
                                    <p className="text-sm text-white/60 leading-snug truncate">All five zones with live MetaForge conditions and direct links to detailed map views.</p>
                                </div>
                                <span className="shrink-0 inline-flex items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 border border-blue-400/30 transition-colors">
                                    Open
                                </span>
                            </Link>

                            {/* Loadout builder — ORANGE */}
                            <Link
                                href="/loadouts"
                                className="group flex items-center gap-5 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-950/25 to-black/50 px-5 py-4
                                           hover:border-orange-500/55 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.35)] transition-all hover:-translate-y-px"
                            >
                                <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] uppercase tracking-widest font-semibold text-orange-400">Loadout System</span>
                                        <PageMaturityBadge level="beta" />
                                    </div>
                                    <p className="text-sm text-white/60 leading-snug truncate">Plan gear from the ARDB catalog, assign slots, and save builds in your browser.</p>
                                </div>
                                <span className="shrink-0 inline-flex items-center justify-center rounded-lg bg-orange-600 group-hover:bg-orange-500 text-white text-xs font-bold py-2 px-4 border border-orange-400/30 transition-colors">
                                    Open
                                </span>
                            </Link>

                            {/* Blueprint tracker — YELLOW */}
                            <Link
                                href="/blueprints"
                                className="group flex items-center gap-5 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/25 to-black/50 px-5 py-4
                                           hover:border-yellow-500/55 hover:shadow-[0_0_30px_-10px_rgba(234,179,8,0.35)] transition-all hover:-translate-y-px"
                            >
                                <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] uppercase tracking-widest font-semibold text-yellow-400">Blueprint Tracking</span>
                                        <PageMaturityBadge level="beta" />
                                    </div>
                                    <p className="text-sm text-white/60 leading-snug truncate">Track owned blueprints against the community list, filter by category, jump to ARDB.</p>
                                </div>
                                <span className="shrink-0 inline-flex items-center justify-center rounded-lg bg-yellow-500 group-hover:bg-yellow-400 text-black text-xs font-bold py-2 px-4 border border-yellow-400/30 transition-colors">
                                    Open
                                </span>
                            </Link>

                            {/* Marketplace — ORANGE */}
                            <Link
                                href="/marketplace"
                                className="group flex items-center gap-5 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-950/25 to-black/50 px-5 py-4
                                           hover:border-orange-500/55 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.35)] transition-all hover:-translate-y-px"
                            >
                                <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] uppercase tracking-widest font-semibold text-orange-400">Marketplace</span>
                                        <PageMaturityBadge level="beta" />
                                    </div>
                                    <p className="text-sm text-white/60 leading-snug truncate">Browse the item catalog, list gear for sale, and use the AI listing optimizer.</p>
                                </div>
                                <span className="shrink-0 inline-flex items-center justify-center rounded-lg bg-orange-600 group-hover:bg-orange-500 text-white text-xs font-bold py-2 px-4 border border-orange-400/30 transition-colors">
                                    Open
                                </span>
                            </Link>

                            {/* Skill Tree Planner — BLUE */}
                            <Link
                                href="/skill-trees"
                                className="group flex items-center gap-5 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-black/50 px-5 py-4
                                           hover:border-blue-500/55 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.35)] transition-all hover:-translate-y-px"
                            >
                                <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] uppercase tracking-widest font-semibold text-blue-400">Skill Trees</span>
                                        <PageMaturityBadge level="beta" />
                                    </div>
                                    <p className="text-sm text-white/60 leading-snug truncate">Allocate expedition points across Conditioning, Mobility, and Survival. Share your build.</p>
                                </div>
                                <span className="shrink-0 inline-flex items-center justify-center rounded-lg bg-blue-600 group-hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 border border-blue-400/30 transition-colors">
                                    Open
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}
