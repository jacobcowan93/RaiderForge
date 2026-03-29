import type { Metadata } from 'next'

import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Providers from '../components/Providers'
import DevBanner from '../components/DevBanner'
import { SiteMain } from '../components/SiteMain'

export const metadata: Metadata = {
    title: 'RaiderForge • ARC Raiders Command Center',
    description: 'ARC Raiders companion hub — maps, builds, blueprints, and marketplace',
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
