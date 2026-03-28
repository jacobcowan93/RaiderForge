/**
 * Visual tokens for curated map POIs (Leaflet divIcons).
 * Distinct from quest dots (solid circles), container diamonds, and loot hollow circles.
 * POI pins render as rounded squares — immediately recognisable as curated RaiderForge data.
 *
 * Palette rules:
 *   - Emerald (#34d399)  = Extract  — green signals "safe exit"
 *   - Amber   (#fbbf24)  = Key      — gold signals "valuable access"
 *   - Indigo  (#818cf8)  = Quest    — cool purple for objectives
 *   - Slate   (#94a3b8)  = Area     — neutral label, low visual weight
 *   - Orange  (#f97316)  = Container — warm, loot-adjacent
 *   - Pink    (#f472b6)  = Loot     — distinct from container orange
 *   - Red     (#f87171)  = ARC      — danger / enemy
 *   - Lime    (#a3e635)  = Nature   — yellow-green, clearly ≠ emerald extract
 *   - Sky     (#38bdf8)  = Interact — cool blue for traversal
 *   - Purple  (#c084fc)  = Noise    — soft purple for hazards
 */

import type { PoiCategory } from '@/lib/maps/poi-types'

export type PoiCategoryVisual = {
    label: string
    color: string
}

export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryVisual> = {
    // Locations group
    extract:     { label: 'Extract',     color: '#34d399' },
    key:         { label: 'Key',         color: '#fbbf24' },
    quest:       { label: 'Quest',       color: '#818cf8' },
    area:        { label: 'Area',        color: '#94a3b8' },

    // Loot group
    container:   { label: 'Container',   color: '#f97316' },
    loot:        { label: 'Loot',        color: '#f472b6' },

    // World group
    arc:         { label: 'ARC',         color: '#f87171' },
    nature:      { label: 'Nature',      color: '#a3e635' },
    interaction: { label: 'Interact.',   color: '#38bdf8' },
    noise:       { label: 'Noise',       color: '#c084fc' },
}

export function buildPoiMarkerHtml(category: PoiCategory, selected: boolean): string {
    const { color } = POI_CATEGORY_META[category]
    if (selected) {
        return `<div style="
      box-sizing:border-box;
      width:22px;
      height:22px;
      background:${color};
      border:3px solid rgba(255,255,255,0.95);
      border-radius:6px;
      box-shadow:
        0 0 0 2px rgba(0,0,0,0.55),
        0 0 14px ${color},
        0 0 28px ${color}55,
        0 2px 8px rgba(0,0,0,0.85);
      cursor:pointer;
    "></div>`
    }
    return `<div style="
    box-sizing:border-box;
    width:18px;
    height:18px;
    background:${color};
    border:2.5px solid rgba(255,255,255,0.80);
    border-radius:5px;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.5),
      0 0 9px ${color}b0,
      0 2px 6px rgba(0,0,0,0.75);
    cursor:pointer;
    transition:transform 0.1s;
  " onmouseenter="this.style.transform='scale(1.22)'" onmouseleave="this.style.transform='scale(1)'"></div>`
}
