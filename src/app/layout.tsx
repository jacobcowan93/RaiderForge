import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Providers from '../components/Providers'
import DevBanner from '../components/DevBanner'
import LivePanel from '../components/LivePanel'

export const metadata = {
    title: 'Raider Forge',
    description: 'ARC Raiders companion hub — maps, builds, blueprints, and marketplace'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-rf-bg text-rf-text antialiased">
                <Providers>
                    <div className="flex min-h-screen flex-col">
                        <NavBar />
                        <DevBanner />
                        <main className="relative flex-1 min-w-0 pt-16 pb-[3.25rem] xl:pb-0 xl:pr-[300px]">
                            <LivePanel />
                            {children}
                        </main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    )
}
