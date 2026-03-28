import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
    title: 'Loadout Builder (Beta) — ARC Raiders | Raider Forge',
    description:
        'Plan raid loadouts with ARDB-backed gear. Save builds locally; MetaForge event synergy coming later.',
}

export default function LoadoutsLayout({ children }: { children: ReactNode }) {
    return children
}
