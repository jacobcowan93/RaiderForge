import Card from '../components/Card'
import Link from 'next/link'
import { AuthButtons } from './components/auth/AuthButtons'

export default function Home() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative h-screen overflow-hidden">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                    src="/images/ARC_Home.mp4"
                />

                {/* dark overlay for legibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-rf-bg/95" />

                <div className="relative z-10 flex h-full items-center justify-center px-4">
                    <div className="max-w-xl space-y-6 text-center">
                        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            Forge your ARC Raiders loadouts.
                        </h1>
                        <p className="text-rf-textSoft">
                            Log in to sync builds, share with your squad, and stay battle‑ready.
                        </p>

                        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                            <AuthButtons />
                        </div>

                        <p className="text-xs text-rf-textSoft">
                            By signing in you agree to the RaiderForge terms of service.
                        </p>
                    </div>
                </div>
            </section>

            {/* Features Section - Below the fold */}
            <section className="bg-rf-bg py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-semibold text-rf-text mb-4">Command Your Arsenal</h2>
                        <p className="text-rf-textSoft max-w-2xl mx-auto">
                            Everything you need to dominate in ARC Raiders: interactive maps, optimized builds, blueprint tracking, and marketplace integration.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card title="Interactive Map">
                            <p className="text-rf-textSoft">Navigate ARC Raiders worlds with markers, filters, and real-time updates.</p>
                            <Link href="/map" className="text-rf-red hover:text-rf-orange mt-2 inline-block">Explore Map →</Link>
                        </Card>
                        <Card title="MetaForge Builds">
                            <p className="text-rf-textSoft">Create and share optimized skill trees with your squad.</p>
                            <Link href="/builds" className="text-rf-red hover:text-rf-orange mt-2 inline-block">View Builds →</Link>
                        </Card>
                        <Card title="Blueprint Tracker">
                            <p className="text-rf-textSoft">Track your collection progress and unlock requirements.</p>
                            <Link href="/blueprints" className="text-rf-red hover:text-rf-orange mt-2 inline-block">Track Blueprints →</Link>
                        </Card>
                        <Card title="Strategy Guides">
                            <p className="text-rf-textSoft">Community-curated routes, tips, and optimization guides.</p>
                            <Link href="/guides" className="text-rf-red hover:text-rf-orange mt-2 inline-block">Read Guides →</Link>
                        </Card>
                        <Card title="Raider Profile">
                            <p className="text-rf-textSoft">Sync your progress and showcase your achievements.</p>
                            <Link href="/profile" className="text-rf-red hover:text-rf-orange mt-2 inline-block">View Profile →</Link>
                        </Card>
                        <Card title="G2G Marketplace">
                            <p className="text-rf-textSoft">Buy and sell blueprints with trusted community members.</p>
                            <Link href="/marketplace" className="text-rf-red hover:text-rf-orange mt-2 inline-block">Browse Marketplace →</Link>
                        </Card>
                    </div>
                </div>
            </section>
        </>
    )
}
