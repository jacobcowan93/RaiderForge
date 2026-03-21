"use client"

import Link from 'next/link'
import React from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function NavBar() {
    const { data: session } = useSession()

    return (
        <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-md bg-gradient-to-tr from-rf-red via-rf-orange to-rf-yellow" />
                <span className="text-sm font-semibold tracking-[0.2em] text-rf-text uppercase">
                    RaiderForge
                </span>
            </div>

            <div className="flex items-center gap-3">
                <button className="hidden text-xs text-rf-textSoft hover:text-white sm:inline-flex">
                    Docs
                </button>
                {session?.user ? (
                    <div className="flex items-center gap-3">
                        {session.user.image && <img src={session.user.image as string} alt="avatar" className="h-8 w-8 rounded-full" />}
                        <div className="text-sm">{session.user.name}</div>
                        <button onClick={() => signOut()} className="px-3 py-1 bg-rf-bgSoft text-rf-text rounded-md hover:bg-rf-border">Sign Out</button>
                    </div>
                ) : (
                    <button onClick={() => signIn('discord')} className="rounded-md border border-rf-red/60 bg-black/60 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-rf-red/40 transition hover:bg-rf-red hover:border-rf-red">
                        Sign in
                    </button>
                )}
            </div>
        </nav>
    )
}
