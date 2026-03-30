import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Blueprint Tracker',
    description:
        'Track which ARC Raiders blueprints you own, filter by category, and export your missing list as PDF or JPEG. Sign in to sync your collection across devices.',
    openGraph: {
        title: 'ARC Raiders Blueprint Tracker • RaiderForge',
        description:
            'Track owned blueprints, filter by category, and export your missing list. Sign in to sync across devices.',
    },
}

export default function BlueprintsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
