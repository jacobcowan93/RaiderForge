import type { Metadata } from 'next'
import Link from 'next/link'
import { HeroBackgroundVideo } from '@/components/HeroBackgroundVideo'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { SITE_MAIN_HERO_PULL_CLASS, SITE_MAIN_TOP_PAD_CLASS } from '@/components/SiteMain'

export const metadata: Metadata = {
    title: 'RaiderForge — The Definitive ARC Raiders Community Toolkit',
    description:
        'Free ARC Raiders companion app: skill tree planner, blueprint tracker, loadout builder, weekly trials, strategy guides, and an AI-powered marketplace. Community-built, not affiliated with Embark Studios.',
    alternates: { canonical: 'https://raiderforge.org' },
    openGraph: {
        title: 'RaiderForge — The Definitive ARC Raiders Community Toolkit',
        description: 'Maps, skill trees, blueprints, marketplace, and more — all free. The definitive ARC Raiders companion.',
        url: 'https://raiderforge.org',
    },
}

/* ─── Shared icon sizes ──────────────────────────────────────────────────── */
const ICON_W = 'w-5 h-5'

/* ─── Feature card data ──────────────────────────────────────────────────── */
type FeatureCard = {
    href: string
    accentClass: string          // border + from-gradient
    hoverBorderClass: string     // border brightens to accent colour on hover
    iconBgClass: string          // icon container bg
    iconTextClass: string        // icon colour
    openBtnClass: string         // "Open" pill colours
    label: string
    labelClass: string           // uppercase accent colour
    badge: 'live' | 'beta'
    desc: string
    hoverShadow: string          // tailwind arbitrary shadow
    icon: React.ReactNode
}

const FEATURES: FeatureCard[] = [
    {
        href: '/trials',
        accentClass: 'border-red-500/30 from-red-950/30',
        hoverBorderClass: 'hover:border-red-400/65',
        iconBgClass: 'bg-red-500/15 border-red-500/30',
        iconTextClass: 'text-red-400',
        openBtnClass: 'bg-red-600 group-hover:bg-red-500 border-red-400/30',
        label: 'Weekly Trials',
        labelClass: 'text-red-400',
        badge: 'live',
        desc: "This week's rotations, max-score tips, reset countdown, and the full filterable catalog.",
        hoverShadow: 'hover:shadow-[0_0_44px_-3px_rgba(239,68,68,0.60)]',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_W} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    },
    {
        href: '/blueprints',
        accentClass: 'border-yellow-500/30 from-yellow-950/25',
        hoverBorderClass: 'hover:border-yellow-400/65',
        iconBgClass: 'bg-yellow-500/15 border-yellow-500/30',
        iconTextClass: 'text-yellow-400',
        openBtnClass: 'bg-yellow-500 group-hover:bg-yellow-400 text-black border-yellow-400/30',
        label: 'Blueprint Tracking',
        labelClass: 'text-yellow-400',
        badge: 'beta',
        desc: 'Track owned blueprints against the community list, filter by category, export to PDF.',
        hoverShadow: 'hover:shadow-[0_0_44px_-3px_rgba(234,179,8,0.60)]',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_W} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
        ),
    },
    {
        href: '/marketplace',
        accentClass: 'border-orange-500/30 from-orange-950/25',
        hoverBorderClass: 'hover:border-orange-400/65',
        iconBgClass: 'bg-orange-500/15 border-orange-500/30',
        iconTextClass: 'text-orange-400',
        openBtnClass: 'bg-orange-600 group-hover:bg-orange-500 border-orange-400/30',
        label: 'Marketplace',
        labelClass: 'text-orange-400',
        badge: 'beta',
        desc: 'Browse the item catalog, list gear for sale, and use the AI listing optimizer.',
        hoverShadow: 'hover:shadow-[0_0_44px_-3px_rgba(249,115,22,0.60)]',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_W} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
        ),
    },
    {
        href: '/loadouts',
        accentClass: 'border-orange-500/25 from-orange-950/20',
        hoverBorderClass: 'hover:border-orange-400/55',
        iconBgClass: 'bg-orange-500/12 border-orange-500/25',
        iconTextClass: 'text-orange-300',
        openBtnClass: 'bg-orange-700 group-hover:bg-orange-600 border-orange-500/30',
        label: 'Loadout System',
        labelClass: 'text-orange-300',
        badge: 'beta',
        desc: 'Plan gear from the ARDB catalog, assign slots, and save builds in your browser.',
        hoverShadow: 'hover:shadow-[0_0_44px_-3px_rgba(249,115,22,0.52)]',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_W} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
        ),
    },
    {
        href: '/skill-trees',
        accentClass: 'border-blue-500/30 from-blue-950/30',
        hoverBorderClass: 'hover:border-blue-400/65',
        iconBgClass: 'bg-blue-500/15 border-blue-500/30',
        iconTextClass: 'text-blue-400',
        openBtnClass: 'bg-blue-600 group-hover:bg-blue-500 border-blue-400/30',
        label: 'Skill Trees',
        labelClass: 'text-blue-400',
        badge: 'beta',
        desc: 'Allocate expedition points across Conditioning, Mobility, and Survival. Share your build.',
        hoverShadow: 'hover:shadow-[0_0_44px_-3px_rgba(59,130,246,0.60)]',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={ICON_W} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
        ),
    },
]

export default function Home() {
    return (
        <>
            {/* ── Hero ──────────────────────────────────────────────────────────── */}
            <section
                className={`relative ${SITE_MAIN_HERO_PULL_CLASS} h-screen overflow-hidden`}
                aria-label="Hero"
            >
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/images/header/ARC_Header.jpeg')" }}
                    aria-hidden="true"
                />
                <HeroBackgroundVideo poster="/images/header/ARC_Header.jpeg" src="/images/ARC_Home.mp4" />

                {/* Dark vignette overlay — stronger immersion over video */}
                <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/20 to-black/70" aria-hidden="true" />

                <div className={`relative z-10 flex h-full flex-col items-center justify-center px-4 text-center ${SITE_MAIN_TOP_PAD_CLASS}`}>
                    {/* Eyebrow */}
                    <span
                        className="hero-enter text-shadow-hero inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold mb-4"
                        style={{ animationDelay: '0.05s' }}
                        aria-hidden="true"
                    >
                        <span className="h-px w-8 bg-rf-orange/70" />
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-rf-cyan animate-pulse" aria-hidden="true" />
                        <span className="tracking-widest text-rf-cyan rf-glow-cyan">Tactical Hub</span>
                        <span className="h-px w-8 bg-rf-orange/70" />
                    </span>

                    {/* Title */}
                    <h1
                        className="hero-enter text-shadow-hero text-5xl font-black tracking-tight sm:text-7xl leading-none"
                        style={{ animationDelay: '0.18s' }}
                    >
                        <span className="text-white">Raider</span>
                        <span className="text-rf-redSoft">Forge</span>
                    </h1>

                    {/* Sub */}
                    <p
                        className="hero-enter text-shadow-hero mt-5 max-w-[36rem] text-sm sm:text-base font-medium text-white/85 leading-relaxed"
                        style={{ animationDelay: '0.32s' }}
                    >
                        The all-in-one ARC Raiders toolkit — skill planner, loadouts, blueprints, and a live marketplace with AI-powered listing tools.
                    </p>

                    {/* CTAs */}
                    <div
                        className="hero-enter mt-8 flex flex-col items-center gap-4 sm:gap-3 w-full max-w-sm sm:max-w-none"
                        style={{ animationDelay: '0.44s' }}
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {/* Primary — neon cyan */}
                            <Link
                                href="/blueprints"
                                className="rf-btn-primary rf-neon-pulse w-full sm:w-auto text-sm sm:text-base px-8 py-3.5 sm:px-10 sm:py-4"
                            >
                                Blueprint Tracker
                            </Link>
                            {/* Secondary — ghost */}
                            <Link
                                href="/marketplace"
                                className="rf-btn-ghost w-full sm:w-auto text-sm sm:text-base px-8 py-3.5 sm:px-10 sm:py-4"
                            >
                                Marketplace
                            </Link>
                        </div>

                        <p className="text-xs sm:text-sm text-white/55 max-w-md leading-relaxed text-shadow-hero">
                            Track your blueprints — or browse and list items in the marketplace.
                        </p>
                        <p className="text-xs text-white/38 text-shadow-hero">
                            Already playing?{' '}
                            <Link href="/sync" className="text-rf-cyan/75 underline underline-offset-2 hover:text-rf-cyan transition-colors">
                                Sync your profile
                            </Link>{' '}
                            to auto-track blueprints &amp; progress.
                        </p>
                    </div>
                </div>

                {/* Scroll hint */}
                <a
                    href="#features"
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                    aria-label="Scroll to features"
                >
                    <span>Explore</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 animate-bounce"
                        aria-hidden="true"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                </a>
            </section>

            {/* ── Features ──────────────────────────────────────────────────────── */}
            <section id="features" className="relative overflow-hidden py-16 px-6 bg-rf-bgPanel border-t border-rf-cyan/[0.14]" aria-label="Available tools">
                {/* Ambient neon glow emanating from the top — gives the section a lit-from-above feel */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(34,211,238,0.07)_0%,transparent_100%)]" aria-hidden="true" />
                <div className="mx-auto max-w-7xl">

                    {/* Section header */}
                    <div className="text-center mb-10">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-rf-orange/75 font-bold mb-2">
                            Field kit
                        </p>
                        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
                            What you can use today
                        </h2>
                        {/* Neon cyan divider */}
                        <div className="rf-divider-cyan mx-auto max-w-xs" aria-hidden="true" />
                    </div>

                    {/* Feature cards */}
                    <div className="flex flex-col gap-2.5 max-w-3xl mx-auto">
                        {FEATURES.map(({ href, accentClass, hoverBorderClass, iconBgClass, iconTextClass, openBtnClass, label, labelClass, badge, desc, hoverShadow, icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`group flex items-center gap-5 rounded-xl border bg-gradient-to-r to-black/50 px-5 py-4 transition-all duration-200 hover:-translate-y-1 ${accentClass} ${hoverBorderClass} ${hoverShadow}`}
                            >
                                {/* Icon */}
                                <div className={`shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg border ${iconBgClass} ${iconTextClass}`}>
                                    {icon}
                                </div>

                                {/* Body */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] uppercase tracking-widest font-semibold ${labelClass}`}>
                                            {label}
                                        </span>
                                        <PageMaturityBadge level={badge} />
                                    </div>
                                    <p className="text-sm text-white/70 leading-snug truncate">{desc}</p>
                                </div>

                                {/* Open pill */}
                                <span className={`shrink-0 inline-flex items-center justify-center rounded-lg text-white text-xs font-bold py-2 px-4 border transition-colors ${openBtnClass}`}
                                    aria-hidden="true"
                                >
                                    Open
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* Non-affiliation disclaimer */}
                    <p className="mt-10 text-center text-[11px] text-white/28 max-w-lg mx-auto leading-relaxed">
                        RaiderForge is an independent community project and is{' '}
                        <strong className="text-white/38 font-medium">not affiliated with, endorsed by, or connected to Embark Studios</strong>.
                        {' '}ARC Raiders™ and related marks are trademarks of Embark Studios AB.
                    </p>
                </div>
            </section>
        </>
    )
}
