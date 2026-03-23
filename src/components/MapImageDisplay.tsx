'use client'

import { useState } from 'react'
import type { MapMeta } from '../data/maps'

type Props = { map: MapMeta }

export default function MapImageDisplay({ map }: Props) {
    const [activeFloor, setActiveFloor] = useState(0)

    if (map.mapType === 'multi-floor' && map.floors && map.floors.length > 0) {
        const floor = map.floors[activeFloor]
        return (
            <div>
                {/* Floor switcher */}
                <div className="flex items-center gap-1 px-4 py-3 border-b border-white/5 bg-black/20">
                    <span className="text-[10px] text-white/20 mr-2 uppercase tracking-widest">Floor</span>
                    {map.floors.map((f, i) => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFloor(i)}
                            className={`text-xs font-medium rounded-lg px-3 py-1.5 transition-all ${
                                activeFloor === i
                                    ? 'bg-rf-red/20 text-rf-red border border-rf-red/30 shadow-sm shadow-rf-red/10'
                                    : 'text-white/35 hover:text-white/70 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {/* Map image */}
                <div className="relative bg-black/40">
                    <img
                        src={floor.image}
                        alt={`${map.displayName} — ${floor.label}`}
                        className="w-full object-contain max-h-[520px]"
                    />
                    <MarkerUnavailableBadge />
                </div>
            </div>
        )
    }

    // Standard single-image map
    const src = map.image ?? '/images/ARC_Maps.PNG'
    return (
        <div className="relative bg-black/40">
            <img
                src={src}
                alt={map.displayName}
                className="w-full object-contain max-h-[520px]"
            />
            <MarkerUnavailableBadge />
        </div>
    )
}

function MarkerUnavailableBadge() {
    return (
        <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 text-[9px] text-white/20 bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 border border-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-2.5 h-2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                Markers unavailable
            </span>
        </div>
    )
}
