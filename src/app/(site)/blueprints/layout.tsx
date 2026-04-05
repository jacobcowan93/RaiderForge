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
    return (
        <div className="relative">
            {/* Blue category accent — Blueprint Tracking identity */}
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[4] h-[3px] bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" aria-hidden />
            <div className="pointer-events-none fixed inset-x-0 top-0 z-[4] h-40 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(56,189,248,0.07)_0%,transparent_100%)]" aria-hidden />
            {children}
        </div>
    )
}
