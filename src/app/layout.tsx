import type { Metadata } from 'next'

import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Providers from '../components/Providers'
import DevBanner from '../components/DevBanner'
import { SiteMain } from '../components/SiteMain'

export const metadata: Metadata = {
    title: {
        default: 'RaiderForge • ARC Raiders Toolkit',
        template: '%s • RaiderForge',
    },
    description:
        'The all-in-one ARC Raiders companion — interactive maps, skill tree planner, blueprint tracker, loadout builder, and a live marketplace with AI-powered listing tools.',
    keywords: ['ARC Raiders', 'ARC Raiders map', 'ARC Raiders skill tree', 'ARC Raiders blueprints', 'ARC Raiders marketplace', 'ARC Raiders loadouts', 'extraction shooter'],
    openGraph: {
        siteName: 'RaiderForge',
        title: 'RaiderForge • ARC Raiders Toolkit',
        description:
            'The all-in-one ARC Raiders companion — maps, skill trees, blueprints, loadouts, and a live marketplace.',
        type: 'website',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'RaiderForge • ARC Raiders Toolkit',
        description:
            'The all-in-one ARC Raiders companion — maps, skill trees, blueprints, loadouts, and a live marketplace.',
    },
    // Tab icon uses ARC_Icon from public/images/ARC_Icon.png (via favicon.* in /public).
    icons: {
        icon: [{ url: '/favicon.png', type: 'image/png' }],
    },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-rf-bg text-rf-text antialiased">
                <Providers>
                    <div className="flex min-h-screen flex-col">
                        <NavBar />
                        <DevBanner />
                        <SiteMain>{children}</SiteMain>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    )
}
