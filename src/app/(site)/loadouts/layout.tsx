import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
    title: 'Loadout Builder — Plan Your ARC Raiders Gear Setup',
    description:
        'Build and save ARC Raiders loadouts from the full ARDB item catalog. Assign weapons, armor, gadgets, and consumables to slots. Browser-saved — no account required.',
    keywords: ['ARC Raiders loadout', 'ARC Raiders build', 'ARC Raiders gear', 'loadout planner', 'ARC Raiders equipment'],
    openGraph: {
        title: 'ARC Raiders Loadout Builder | RaiderForge',
        description: 'Plan your ARC Raiders gear loadout from the full item catalog. Save builds in your browser — free.',
        url: 'https://raiderforge.org/loadouts',
    },
    alternates: { canonical: 'https://raiderforge.org/loadouts' },
}

export default function LoadoutsLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative">
            {/* Yellow category accent — Loadouts identity */}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[4] h-[3px] bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent" aria-hidden />
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[4] h-40 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(234,179,8,0.07)_0%,transparent_100%)]" aria-hidden />
            {children}
        </div>
    )
}
