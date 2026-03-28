import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { exampleGuides } from '@/data/guides'

export default function GuidesPage() {
    return (
        <div className="py-8 px-4 sm:px-6 max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold text-white">Guides &amp; routes</h1>
                <PageMaturityBadge level="beta" />
            </div>
            <p className="text-sm text-rf-textSoft mb-6 max-w-2xl">
                Sample routes and tips — we&apos;re expanding this section with community-curated guides.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exampleGuides.map((g) => (
                    <div key={g.id} className="rf-card p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{g.title}</h3>
                            <span className="text-xs text-gray-300 capitalize">{g.difficulty}</span>
                        </div>
                        <p className="text-sm text-gray-300 mt-2">{g.description}</p>
                        {g.waypoints && (
                            <ul className="text-xs text-gray-400 mt-2">
                                {g.waypoints.map((w, i) => (
                                    <li key={i}>{w.name}{w.note ? ` — ${w.note}` : ''}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
