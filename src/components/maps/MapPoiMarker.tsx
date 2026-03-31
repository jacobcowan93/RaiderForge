/**
 * Visual tokens for curated map POIs (Leaflet divIcons).
 * Uses sourced TCNO icon assets where we have an accurate match, with conservative
 * fallback to category-level icons when the current RaiderForge POI data is broader.
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
import type { MapPoi } from '@/lib/maps/poi-types'
import { getCategoryIconSrc, resolvePoiIconSrc } from '@/lib/maps/tcnoArcIcons'

export type PoiCategoryVisual = {
    label: string
    color: string
    iconSrc: string
}

export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryVisual> = {
    // Locations group
    extract:     { label: 'Extract',     color: '#34d399', iconSrc: getCategoryIconSrc('extract') },
    key:         { label: 'Key',         color: '#fbbf24', iconSrc: getCategoryIconSrc('key') },
    quest:       { label: 'Quest',       color: '#818cf8', iconSrc: getCategoryIconSrc('quest') },
    area:        { label: 'Area',        color: '#94a3b8', iconSrc: getCategoryIconSrc('area') },

    // Loot group
    container:   { label: 'Container',   color: '#f97316', iconSrc: getCategoryIconSrc('container') },
    loot:        { label: 'Loot',        color: '#f472b6', iconSrc: getCategoryIconSrc('loot') },

    // World group
    arc:         { label: 'ARC',         color: '#f87171', iconSrc: getCategoryIconSrc('arc') },
    nature:      { label: 'Nature',      color: '#a3e635', iconSrc: getCategoryIconSrc('nature') },
    interaction: { label: 'Interact.',   color: '#38bdf8', iconSrc: getCategoryIconSrc('interaction') },
    noise:       { label: 'Noise',       color: '#c084fc', iconSrc: getCategoryIconSrc('noise') },
}

export function buildPoiMarkerHtml(poi: Pick<MapPoi, 'category' | 'name' | 'iconKey'>, selected: boolean): string {
    const { color } = POI_CATEGORY_META[poi.category]
    const iconSrc = resolvePoiIconSrc(poi)
    const size = selected ? 22 : 18
    const inner = selected ? 14 : 12
    const radius = selected ? 7 : 6
    if (selected) {
        return `<div style="
      box-sizing:border-box;
      width:${size}px;
      height:${size}px;
      background:rgba(5,10,18,0.96);
      border:2.5px solid rgba(255,255,255,0.95);
      border-radius:${radius}px;
      box-shadow:
        0 0 0 2px rgba(0,0,0,0.55),
        0 0 14px ${color},
        0 0 28px ${color}55,
        0 2px 8px rgba(0,0,0,0.85);
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
    ">
      <div style="
        width:${inner}px;
        height:${inner}px;
        border-radius:4px;
        background:${color}22 url('${iconSrc}') center/contain no-repeat;
        filter:drop-shadow(0 0 6px ${color});
      "></div>
    </div>`
    }
    return `<div style="
    box-sizing:border-box;
    width:${size}px;
    height:${size}px;
    background:rgba(5,10,18,0.92);
    border:1.5px solid rgba(255,255,255,0.74);
    border-radius:${radius}px;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.5),
      0 0 9px ${color}b0,
      0 2px 6px rgba(0,0,0,0.75);
    cursor:pointer;
    transition:transform 0.1s;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
  " onmouseenter="this.style.transform='scale(1.22)'" onmouseleave="this.style.transform='scale(1)'">
    <div style="
      width:${inner}px;
      height:${inner}px;
      border-radius:4px;
      background:${color}1a url('${iconSrc}') center/contain no-repeat;
      filter:drop-shadow(0 0 5px ${color});
    "></div>
  </div>`
}
