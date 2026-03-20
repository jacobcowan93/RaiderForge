import Card from '../components/Card'
import Link from 'next/link'

export default function Home() {
    return (
        <div className="relative h-[70vh] rounded-lg overflow-hidden mb-8">
            <video
                className="absolute inset-0 w-full h-full object-cover"
                src="/images/ARC_Home.mp4"
                autoPlay
                loop
                muted
                playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
            <div className="relative z-10 p-8 flex flex-col h-full justify-center">
                <div className="flex items-center gap-4 mb-4">
                    <img src="/images/logo.png" alt="Raider Forge" className="h-16" />
                    <div>
                        <h1 className="text-4xl font-bold">Raider Forge</h1>
                        <p className="text-gray-300">ARC Raiders command center — interactive maps, MetaForge builds, blueprints, profile sync, and marketplace.</p>
                    </div>
                </div>

                <div className="flex gap-4 mt-6">
                    <Link href="/map" className="px-4 py-2 bg-rf-red text-black rounded-md">Open Map</Link>
                    <Link href="/blueprints" className="px-4 py-2 border border-gray-600 rounded-md">View Blueprints</Link>
                </div>
            </div>

            <section className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card title="Map"><p>Interactive map with markers and filters.</p></Card>
                <Card title="Guides"><p>Guides and optimized routes.</p></Card>
                <Card title="Builds"><p>MetaForge skill tree editor integration.</p></Card>
                <Card title="Blueprints"><p>Track owned blueprints and progress.</p></Card>
                <Card title="Profile"><p>Raider profile sync via MetaForge.</p></Card>
                <Card title="Marketplace"><p>G2G marketplace integration (mock).</p></Card>
            </section>
        </div>
    )
}
