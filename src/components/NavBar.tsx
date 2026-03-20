"use client"

import Link from 'next/link'
import React from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function NavBar() {
    const { data: session } = useSession()

    return (
        <nav className="w-full bg-transparent py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <img src="/images/logo.png" alt="Raider Forge" className="h-10 w-auto" />
                </Link>
                <div className="hidden md:flex gap-4 text-sm text-gray-200">
                    <Link href="/">Home</Link>
                    <Link href="/map">Map</Link>
                    <Link href="/guides">Guides</Link>
                    <Link href="/builds">Builds</Link>
                    <Link href="/blueprints">Blueprints</Link>
                    <Link href="/profile">Profile</Link>
                    <Link href="/marketplace">Marketplace</Link>
                </div>
            </div>

            <div className="hidden md:block">
                {session?.user ? (
                    <div className="flex items-center gap-3">
                        {session.user.image && <img src={session.user.image as string} alt="avatar" className="h-8 w-8 rounded-full" />}
                        <div className="text-sm">{session.user.name}</div>
                        <button onClick={() => signOut()} className="px-3 py-1 bg-gray-700 text-white rounded-md">Sign Out</button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => signIn('google')} className="px-3 py-1 bg-rf-red text-black rounded-md">Sign in with Google</button>
                        <button onClick={() => signIn('discord')} className="px-3 py-1 bg-gray-700 text-white rounded-md">Discord</button>
                    </div>
                )}
            </div>

            <div className="md:hidden">
                <button aria-label="Open menu" className="text-gray-200">☰</button>
            </div>
        </nav>
    )
}
