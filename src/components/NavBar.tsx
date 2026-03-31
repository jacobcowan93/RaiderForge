'use client'

/**
 * Responsive site navigation.
 *
 * Mobile contract (must not regress):
 * - From the smallest breakpoint up to `md`, desktop center links are hidden (`hidden md:flex`).
 * - The hamburger control must remain visible and operable on every viewport below `md` — do not stack
 *   breakpoints so that both desktop links and the menu button disappear. If center links are hidden,
 *   users always have the hamburger path to the same destinations.
 */

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

import { PageMaturityBadge } from '@/components/PageMaturityBadge'

type NavLinkItem = {
    href: string
    label: string
    badge?: 'beta' | 'live'
    /** Visual priority for the Skill Tree Planner entry */
    emphasis?: 'planner'
}

const navLinks: NavLinkItem[] = [
    { href: '/', label: 'Home' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/blueprints', label: 'Blueprints' },
    { href: '/skill-trees', label: 'Skill Tree', badge: 'beta' },
    { href: '/maps', label: 'Maps' },
    { href: '/trials', label: 'Trials', badge: 'live' },
    { href: '/guides', label: 'Guides' },
]

function navIsActive(pathname: string, href: string): boolean {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

function NavDestinationLink({
    href,
    label,
    badge,
    emphasis,
    pathname,
    variant,
    onNavigate,
}: {
    href: string
    label: string
    badge?: 'beta' | 'live'
    emphasis?: 'planner'
    pathname: string
    variant: 'desktop' | 'mobile'
    onNavigate?: () => void
}) {
    const isActive = navIsActive(pathname, href)
    const planner = emphasis === 'planner'

    if (variant === 'desktop') {
        const base =
            planner && !isActive
                ? 'border border-rf-red/35 bg-rf-red/[0.12] text-white shadow-[0_0_20px_-8px_rgba(255,64,64,0.45)]'
                : ''
        const idle = isActive ? 'text-white' : planner ? 'text-white/95' : 'text-white/70 hover:text-white hover:bg-white/5'
        return (
            <Link
                href={href}
                onClick={onNavigate}
                className={`relative px-2.5 py-1.5 text-xs font-medium rounded transition-colors inline-flex items-center gap-1.5 ${base} ${idle}`}
            >
                <span className={planner ? 'font-semibold tracking-tight' : ''}>{label}</span>
                {badge === 'beta' ? (
                    <PageMaturityBadge level="beta" className="!px-1 !py-0 !text-[8px] !leading-tight" />
                ) : null}
                {badge === 'live' ? (
                    <PageMaturityBadge level="live" className="!px-1 !py-0 !text-[8px] !leading-tight" />
                ) : null}
                {isActive ? (
                    <span className="absolute inset-x-1 -bottom-[11px] h-[3px] rounded-full bg-rf-green transition-all duration-200" />
                ) : null}
            </Link>
        )
    }

    const mobPlanner = planner && !isActive ? 'border border-rf-red/30 bg-rf-red/10' : ''
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mobPlanner} ${
                isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
            }`}
        >
            <span className={planner ? 'font-semibold' : ''}>{label}</span>
            {badge === 'beta' ? <PageMaturityBadge level="beta" className="!px-1.5 !py-0 !text-[9px]" /> : null}
            {badge === 'live' ? <PageMaturityBadge level="live" className="!px-1.5 !py-0 !text-[9px]" /> : null}
        </Link>
    )
}

export default function NavBar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        setMobileNavOpen(false)
    }, [pathname])

    useEffect(() => {
        if (!mobileNavOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMobileNavOpen(false)
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [mobileNavOpen])

    useEffect(() => {
        if (!mobileNavOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [mobileNavOpen])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const closeMobile = () => setMobileNavOpen(false)

    const toggleMobile = () => {
        setMobileNavOpen((v) => {
            const next = !v
            if (next) setProfileOpen(false)
            return next
        })
    }

    return (
        <>
            {mobileNavOpen ? (
                <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/60 md:hidden"
                    aria-label="Close navigation menu"
                    onClick={closeMobile}
                />
            ) : null}

            <nav
                className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 border-b-2 border-rf-red/40 ${
                    scrolled
                        ? 'bg-rf-bg/[0.97] backdrop-blur-md shadow-lg shadow-black/50'
                        : 'bg-[#05060a]/92 backdrop-blur-md shadow-[0_8px_32px_-12px_rgba(0,0,0,0.65)]'
                }`}
            >
                <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3 max-w-7xl mx-auto min-h-[52px]">
                    <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0 max-w-[min(100%,11rem)] sm:max-w-none" onClick={closeMobile}>
                        <div className="relative h-8 w-8 rounded-md overflow-hidden ring-1 ring-white/10 shrink-0">
                            <Image
                                src="/images/logo/ARC_Header.jpeg"
                                alt="RaiderForge"
                                fill
                                className="object-cover"
                                sizes="32px"
                                priority
                            />
                        </div>
                        <span className="text-sm font-black tracking-[0.18em] uppercase truncate">
                            <span className="text-white">Raider</span>
                            <span className="text-rf-redSoft">Forge</span>
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
                        {navLinks.map(({ href, label, badge, emphasis }) => (
                            <NavDestinationLink
                                key={href}
                                href={href}
                                label={label}
                                badge={badge}
                                emphasis={emphasis}
                                pathname={pathname}
                                variant="desktop"
                            />
                        ))}
                    </div>

                    <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
                        {/*
                         * Always rendered below `md` only — never remove without replacing with another
                         * visible entry to the same `navLinks` destinations on small screens.
                         */}
                        <div className="flex shrink-0 md:hidden">
                            <button
                                type="button"
                                className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                                aria-expanded={mobileNavOpen}
                                aria-controls="mobile-site-nav"
                                onClick={toggleMobile}
                            >
                                <span className="sr-only">{mobileNavOpen ? 'Close menu' : 'Open menu'}</span>
                                {mobileNavOpen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {session?.user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setProfileOpen((v) => !v)
                                        setMobileNavOpen(false)
                                    }}
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors min-h-[40px]"
                                    aria-expanded={profileOpen}
                                    aria-haspopup="menu"
                                    aria-label={`Account menu, signed in as ${session.user.name ?? 'user'}`}
                                >
                                    {session.user.image ? (
                                        <img
                                            src={session.user.image as string}
                                            alt=""
                                            className="h-7 w-7 rounded-full ring-1 ring-rf-red/60"
                                            aria-hidden
                                        />
                                    ) : (
                                        <div className="h-7 w-7 rounded-full bg-rf-red/20 flex items-center justify-center text-xs font-bold text-rf-red">
                                            {session.user.name?.[0]?.toUpperCase() ?? '?'}
                                        </div>
                                    )}
                                    <span className="hidden sm:block max-w-[120px] truncate text-sm font-medium text-white">
                                        {session.user.name}
                                    </span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                        stroke="currentColor"
                                        className={`w-3 h-3 text-white/50 transition-transform shrink-0 ${profileOpen ? 'rotate-180' : ''}`}
                                        aria-hidden
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {profileOpen ? (
                                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-rf-border bg-rf-bg/95 backdrop-blur-md shadow-2xl shadow-black/60 overflow-hidden z-[60]">
                                        <Link
                                            href="/sync"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-3 text-sm text-yellow-300/90 hover:bg-rf-bgSoft transition-colors border-b border-white/[0.06]"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-400/70 shrink-0" aria-hidden>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                            Sync My Profile
                                        </Link>

                                        <Link
                                            href="/profile"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-rf-text hover:bg-rf-bgSoft transition-colors"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 h-4 text-rf-textSoft"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                                />
                                            </svg>
                                            View Profile
                                        </Link>
                                        <div className="h-px bg-rf-border" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                signOut()
                                                setProfileOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rf-textSoft hover:bg-rf-bgSoft hover:text-rf-text transition-colors"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-4 h-4"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                                                />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                    type="button"
                                    onClick={() => signIn()}
                                    className="rounded-md bg-[#22c55e] px-3 py-2 sm:px-4 text-[11px] sm:text-xs font-semibold text-white shadow-md shadow-[#22c55e]/40 transition-all hover:bg-[#16a34a] min-h-[40px]"
                                >
                                    Sign In
                                </button>
                                <Link
                                    href="/auth/signin?intent=signup"
                                    onClick={closeMobile}
                                    className="rounded-md bg-rf-red px-3 py-2 sm:px-4 text-[11px] sm:text-xs font-semibold text-white shadow-md shadow-rf-red/40 transition-all hover:bg-rf-redSoft inline-flex items-center min-h-[40px]"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {mobileNavOpen ? (
                    <div
                        id="mobile-site-nav"
                        className="md:hidden border-t border-white/10 bg-rf-bg/98 backdrop-blur-md shadow-inner max-h-[min(70vh,calc(100dvh-4rem))] overflow-y-auto overscroll-contain"
                    >
                        <ul className="px-2 py-2 space-y-0.5 list-none m-0">
                            {navLinks.map(({ href, label, badge, emphasis }) => (
                                <li key={href}>
                                    <NavDestinationLink
                                        href={href}
                                        label={label}
                                        badge={badge}
                                        emphasis={emphasis}
                                        pathname={pathname}
                                        variant="mobile"
                                        onNavigate={closeMobile}
                                    />
                                </li>
                            ))}
                            {session?.user && (
                                <li>
                                    <Link
                                        href="/sync"
                                        onClick={closeMobile}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-yellow-300/85 hover:bg-yellow-400/[0.08] transition-colors"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-400/70 shrink-0" aria-hidden>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                        Sync My Profile
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>
                ) : null}
            </nav>
        </>
    )
}
