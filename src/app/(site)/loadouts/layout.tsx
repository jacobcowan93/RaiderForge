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
    return children
}
