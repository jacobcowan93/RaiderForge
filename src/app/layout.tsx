import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Providers from '../components/Providers'
import bgLogo from '../assets/images/AR_BasicLogo.png'

export const metadata = {
    title: 'Raider Forge',
    description: 'ARC Raiders companion hub — maps, builds, blueprints, and marketplace'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-rf-bg text-rf-text antialiased">
                <Providers>
                    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-black via-rf-bg to-black">
                        {/* Branded logo watermark — visible on all app pages.
                            On the homepage the full-screen video hero sits on top of this,
                            so the watermark only shows on inner pages. */}
                        <div
                            className="pointer-events-none absolute inset-0 bg-center bg-no-repeat bg-contain opacity-[0.04]"
                            style={{ backgroundImage: `url(${bgLogo.src})` }}
                            aria-hidden="true"
                        />
                        <NavBar />
                        <main className="relative z-10 flex-1 pt-16">{children}</main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    )
}
