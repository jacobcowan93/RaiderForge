/**
 * Visual tokens for curated map POIs (Leaflet divIcons).
 * Distinct from quest dots, container diamonds, and loot hollow circles — rounded square pin.
 */

import type { PoiCategory } from '@/lib/maps/poi-types'

export type PoiCategoryVisual = {
    label: string
    color: string
}

export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryVisual> = {
    quest: { label: 'Quest', color: '#818cf8' },
    container: { label: 'Container', color: '#94a3b8' },
    key: { label: 'Key', color: '#fbbf24' },
    extract: { label: 'Extract', color: '#22c55e' },
}

export function buildPoiMarkerHtml(category: PoiCategory, selected: boolean): string {
    const { color } = POI_CATEGORY_META[category]
    if (selected) {
        return `<div style="
      width:15px;
      height:15px;
      background:${color};
      border:2.5px solid rgba(255,255,255,0.92);
      border-radius:5px;
      box-shadow:0 0 12px ${color}, 0 0 20px ${color}55, 0 1px 4px rgba(0,0,0,0.75);
      cursor:pointer;
    "></div>`
    }
    return `<div style="
    width:12px;
    height:12px;
    background:${color};
    border:2px solid rgba(255,255,255,0.5);
    border-radius:4px;
    box-shadow:0 0 8px ${color}90, 0 1px 3px rgba(0,0,0,0.65);
    cursor:pointer;
    transition:transform 0.1s;
  " onmouseenter="this.style.transform='scale(1.35)'" onmouseleave="this.style.transform='scale(1)'"></div>`
}
