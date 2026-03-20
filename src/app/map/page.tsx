import { getMapMarkers } from '../../api/metaforgeClient'
import React from 'react'

export default async function MapPage() {
    const markers = await getMapMarkers()

    return (
        <div className="py-8">
            <h2 className="text-2xl font-bold mb-4">Interactive Map</h2>
            <p className="text-gray-300 mb-4">Markers loaded from MetaForge (mock)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {markers.map((m) => (
                    <div key={m.id} className="rf-card p-4">
                        <h3 className="font-semibold">{m.name} <span className="text-sm text-gray-400">({m.category})</span></h3>
                        <p className="text-sm text-gray-300">{m.description}</p>
                        <div className="text-xs text-gray-400 mt-2">Region: {m.region}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
