import type { Metadata } from 'next'

import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Providers from '../components/Providers'
import DevBanner from '../components/DevBanner'
import { SiteMain } from '../components/SiteMain'

// Favicon setup (Next.js App Router):
// 1. Place favicon.ico in src/app/ → Next.js auto-generates <link rel="icon">
// 2. metadata.icons is backup / override
// 3. public/favicon.ico kept as static fallback
export const metadata: Metadata = {
    title: 'RaiderForge • ARC Raiders Command Center',
    description: 'ARC Raiders companion hub — maps, builds, blueprints, and marketplace',
    icons: {
        icon: '/favicon.ico',
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
