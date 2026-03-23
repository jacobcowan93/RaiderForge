'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

const navLinks = [
    { href: '/',           label: 'Home'       },
    { href: '/maps',       label: 'Maps'       },
    { href: '/builds',     label: 'Builds'     },
    { href: '/blueprints', label: 'Blueprints' },
    { href: '/guides',     label: 'Guides'     },
    { href: '/marketplace',label: 'Marketplace'},
]

export default function NavBar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [scrolled, setScrolled] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
            scrolled
                ? 'bg-rf-bg/95 backdrop-blur-md border-b border-rf-border shadow-lg shadow-black/50'
                : 'bg-gradient-to-b from-black/75 via-black/30 to-transparent'
        }`}>
            <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">

                {/* ── Left: Logo ── */}
                <Link href="/" className="flex items-center gap-2.5 shrink-0">
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
                    <span className="text-sm font-bold tracking-[0.18em] uppercase">
                        <span className="text-white">Raider</span><span className="text-rf-red">Forge</span>
                    </span>
                </Link>

                {/* ── Center: Nav links ── */}
                <div className="hidden md:flex items-center gap-0.5">
                    {navLinks.map(({ href, label }) => {
                        const isActive = href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(href)
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                                    isActive
                                        ? 'text-white bg-white/10'
                                        : 'text-white/55 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {label}
                            </Link>
                        )
                    })}
                </div>

                {/* ── Right: Auth / Profile ── */}
                <div className="flex items-center gap-2">
                    {session?.user ? (
                        /* Logged in: avatar + name + dropdown */
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setProfileOpen(v => !v)}
                                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-white/10 transition-colors"
                            >
                                {session.user.image ? (
                                    <img
                                        src={session.user.image as string}
                                        alt="avatar"
                                        className="h-7 w-7 rounded-full ring-1 ring-rf-red/60"
                                    />
                                ) : (
                                    <div className="h-7 w-7 rounded-full bg-rf-red/20 flex items-center justify-center text-xs font-bold text-rf-red">
                                        {session.user.name?.[0]?.toUpperCase() ?? '?'}
                                    </div>
                                )}
                                <span className="hidden sm:block text-sm font-medium text-white">
                                    {session.user.name}
                                </span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 text-white/50 transition-transform ${profileOpen ? 'rotate-180' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-rf-border bg-rf-bg/95 backdrop-blur-md shadow-2xl shadow-black/60 overflow-hidden">
                                    <Link
                                        href="/profile"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-rf-text hover:bg-rf-bgSoft transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-rf-textSoft">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                        View Profile
                                    </Link>
                                    <div className="h-px bg-rf-border" />
                                    <button
                                        onClick={() => { signOut(); setProfileOpen(false) }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rf-textSoft hover:bg-rf-bgSoft hover:text-rf-text transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Logged out: Sign In (ghost) + Sign Up (solid red) */
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => signIn()}
                                className="rounded-md bg-[#22c55e] px-4 py-2 text-xs font-semibold text-white shadow-md shadow-[#22c55e]/40 transition-all hover:bg-[#16a34a] hover:shadow-[#22c55e]/20"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => signIn()}
                                className="rounded-md bg-rf-red px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rf-red/40 transition-all hover:bg-rf-redSoft hover:shadow-rf-red/20"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </nav>
    )
}
