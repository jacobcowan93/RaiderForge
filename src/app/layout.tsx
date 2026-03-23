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
        <html lang="en" className="dark">
            <body className="min-h-screen bg-rf-bg text-rf-text antialiased">
                <Providers>
                    <div className="flex min-h-screen flex-col">
                        <NavBar />
                        <main className="flex-1 pt-16">{children}</main>
                        <Footer />
                    </div>
                </Providers>
            </body>
        </html>
    )
}
