import type { Metadata } from 'next'
import Script from 'next/script'

import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Providers from '../components/Providers'
import DevBanner from '../components/DevBanner'
import { SiteMain } from '../components/SiteMain'
import { OnboardingModal } from '../components/OnboardingModal'

const SITE_URL = 'https://raiderforge.org'
const OG_IMAGE = `${SITE_URL}/images/og/raiderforge-og.jpg`

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'RaiderForge — The ARC Raiders Community Toolkit',
        template: '%s | RaiderForge',
    },
    description:
        'The definitive ARC Raiders companion: skill tree planner, blueprint tracker, loadout builder, weekly trials, guides, and an AI-powered marketplace. Free community toolkit.',
    keywords: [
        'ARC Raiders', 'ARC Raiders skill tree', 'ARC Raiders blueprints',
        'ARC Raiders marketplace', 'ARC Raiders loadouts', 'ARC Raiders guide', 'ARC Raiders trials',
        'ARC Raiders wiki', 'ARC Raiders items', 'extraction shooter', 'Embark Studios',
    ],
    authors: [{ name: 'RaiderForge Community' }],
    openGraph: {
        siteName: 'RaiderForge',
        title: 'RaiderForge — The ARC Raiders Community Toolkit',
        description:
            'Interactive maps, skill planner, blueprint tracker, weekly trials & an AI marketplace — all free. The definitive ARC Raiders companion.',
        type: 'website',
        locale: 'en_US',
        url: SITE_URL,
        images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'RaiderForge — ARC Raiders Toolkit' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'RaiderForge — The ARC Raiders Community Toolkit',
        description:
            'Interactive maps, skill planner, blueprint tracker, weekly trials & an AI marketplace. The definitive ARC Raiders companion.',
        images: [OG_IMAGE],
    },
    alternates: {
        canonical: SITE_URL,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    icons: {
        icon: [{ url: '/favicon.png', type: 'image/png' }],
    },
}

const jsonLdWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RaiderForge',
    url: SITE_URL,
    description: 'Free community toolkit for ARC Raiders — maps, skill trees, blueprints, marketplace, and more.',
    potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/guides?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
    },
}

const jsonLdGame = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: 'ARC Raiders',
    description: 'ARC Raiders is a third-person co-op extraction shooter developed by Embark Studios.',
    genre: 'Extraction Shooter',
    developer: { '@type': 'Organization', name: 'Embark Studios' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <head>
                <Script
                    id="schema-website"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
                />
                <Script
                    id="schema-game"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGame) }}
                />
            </head>
            <body className="min-h-screen bg-rf-bg text-rf-text antialiased">
                <a href="#main-content" className="rf-skip-link">Skip to main content</a>
                <Providers>
                    <div className="flex min-h-screen flex-col">
                        <NavBar />
                        <DevBanner />
                        <SiteMain>{children}</SiteMain>
                        <Footer />
                    </div>
                    <OnboardingModal />
                </Providers>
            </body>
        </html>
    )
}
