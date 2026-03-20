import '../styles/globals.css'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import Providers from '../components/Providers'

export const metadata = {
    title: 'Raider Forge',
    description: 'ARC Raiders companion hub — maps, builds, blueprints, and marketplace'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen bg-rf-bg-900 text-white">
                <Providers>
                    <div className="max-w-7xl mx-auto">
                        <NavBar />
                        <main className="px-6">{children}</main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    )
}
