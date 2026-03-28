/**
 * Visual tokens for curated map POIs (Leaflet divIcons).
 * Distinct from quest dots, container diamonds, and loot hollow circles — rounded square pin.
 */

import type { PoiCategory } from '@/lib/maps/poi-types'

export type PoiCategoryVisual = {
    label: string
    color: string
}

/** Slightly lifted chroma for legibility on darkened map tiles (tint overlay). */
export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryVisual> = {
    quest: { label: 'Quest', color: '#8b95fa' },
    container: { label: 'Container', color: '#a8b4c4' },
    key: { label: 'Key', color: '#fcc535' },
    extract: { label: 'Extract', color: '#34d399' },
}

export function buildPoiMarkerHtml(category: PoiCategory, selected: boolean): string {
    const { color } = POI_CATEGORY_META[category]
    if (selected) {
        return `<div style="
      box-sizing:border-box;
      width:22px;
      height:22px;
      background:${color};
      border:3px solid rgba(255,255,255,0.96);
      border-radius:6px;
      box-shadow:
        0 0 0 2px rgba(0,0,0,0.55),
        0 0 14px ${color},
        0 0 26px ${color}66,
        0 2px 8px rgba(0,0,0,0.85);
      cursor:pointer;
    "></div>`
    }
    return `<div style="
    box-sizing:border-box;
    width:18px;
    height:18px;
    background:${color};
    border:2.5px solid rgba(255,255,255,0.82);
    border-radius:5px;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.5),
      0 0 10px ${color}b3,
      0 2px 7px rgba(0,0,0,0.78);
    cursor:pointer;
    transition:transform 0.1s;
  " onmouseenter="this.style.transform='scale(1.22)'" onmouseleave="this.style.transform='scale(1)'"></div>`
}
