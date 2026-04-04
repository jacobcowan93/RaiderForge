import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Blueprint Tracker — Track Every ARC Raiders Blueprint',
    description:
        'Track every ARC Raiders blueprint you own or are missing. Filter by rarity, category, and drop source. Export your missing list as PDF or JPEG. Free — sign in to sync across devices.',
    keywords: ['ARC Raiders blueprints', 'blueprint tracker', 'ARC Raiders items', 'missing blueprints', 'blueprint list'],
    openGraph: {
        title: 'ARC Raiders Blueprint Tracker | RaiderForge',
        description: 'Track, filter, and export your ARC Raiders blueprint collection. Syncs to your account — free.',
        url: 'https://raiderforge.org/blueprints',
    },
    alternates: { canonical: 'https://raiderforge.org/blueprints' },
}

export default function BlueprintsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
