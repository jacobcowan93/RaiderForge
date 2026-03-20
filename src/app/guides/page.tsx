import { exampleGuides } from '../../data/guides'

export default function GuidesPage() {
    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Guides & Routes</h2>
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
