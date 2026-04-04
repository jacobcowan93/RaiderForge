import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Traders — ARC Raiders Vendor Items & Inventory',
    description:
        'Browse ARC Raiders trader inventories for Celeste, Apollo, Lance, Shani, and Tian Wen. Find which items each vendor sells, their categories, and stock availability.',
    keywords: ['ARC Raiders traders', 'Celeste trader', 'Apollo trader', 'Lance trader', 'Shani trader', 'Tian Wen', 'ARC Raiders vendors'],
    alternates: { canonical: 'https://raiderforge.org/traders' },
    openGraph: {
        title: 'ARC Raiders Traders Browser | RaiderForge',
        description: 'All five ARC Raiders traders — browse vendor inventories for Celeste, Apollo, Lance, Shani, and Tian Wen.',
        url: 'https://raiderforge.org/traders',
    },
}

export default function TradersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
