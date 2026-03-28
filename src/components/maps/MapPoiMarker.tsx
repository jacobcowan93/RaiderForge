/**
 * Visual tokens for curated map POIs (Leaflet divIcons).
 * Distinct from quest dots (solid circles), container diamonds, and loot hollow circles.
 * POI pins render as rounded squares — immediately recognisable as curated RaiderForge data.
 *
 * Palette rules (background color of each pin):
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
 *
 * Icon rendering:
 *   Icons are sourced from /public/images/ARC_Raider_Icons/ and rendered as
 *   white overlays on the category color background via CSS filter.
 *   Drop a PNG named [category].png into that folder and it activates automatically.
 *   If an icon file is missing, onerror hides the <img> — the color pin still shows.
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

/**
 * Category → icon file mapping.
 *
 * All paths are relative to /public. Drop a PNG with the matching filename into
 * /public/images/ARC_Raider_Icons/ and it activates without any other changes.
 *
 * Icons are rendered white-on-color (filter: brightness(0) invert(1)) so any
 * single-color icon — whether dark-on-transparent or light-on-transparent —
 * will display correctly on the colored pin background.
 *
 * To point a category at a differently-named file, update its path here only.
 */
export const POI_ICON_MAP: Record<PoiCategory, string> = {
    extract:     '/images/ARC_Raider_Icons/extract.png',
    key:         '/images/ARC_Raider_Icons/key.png',
    quest:       '/images/ARC_Raider_Icons/quest.png',
    area:        '/images/ARC_Raider_Icons/area.png',
    container:   '/images/ARC_Raider_Icons/container.png',
    loot:        '/images/ARC_Raider_Icons/loot.png',
    arc:         '/images/ARC_Raider_Icons/arc.png',
    nature:      '/images/ARC_Raider_Icons/nature.png',
    interaction: '/images/ARC_Raider_Icons/interaction.png',
    noise:       '/images/ARC_Raider_Icons/noise.png',
}

/**
 * Build the inner HTML string for a POI divIcon.
 *
 * Sizes: 18×18 normal, 22×22 selected — matches iconSize in MapTileViewer.
 * The icon image sits centered with 3px visual padding on all sides.
 * If the icon file 404s, onerror hides the <img>; the colored square still renders.
 */
export function buildPoiMarkerHtml(category: PoiCategory, selected: boolean): string {
    const { color } = POI_CATEGORY_META[category]
    const iconSrc   = POI_ICON_MAP[category]
    const innerSize = selected ? 16 : 12  // outer minus ~3px pad each side

    const imgHtml = `<img src="${iconSrc}" width="${innerSize}" height="${innerSize}" style="width:${innerSize}px;height:${innerSize}px;object-fit:contain;filter:brightness(0) invert(1);pointer-events:none;display:block;" onerror="this.style.display='none'" />`

    if (selected) {
        // White inner border → dark edge → crimson ring → red outer halo → category glow
        return `<div style="box-sizing:border-box;width:22px;height:22px;background:${color};border:2.5px solid #fff;border-radius:6px;box-shadow:0 0 0 1.5px rgba(0,0,0,0.75),0 0 0 3.5px #b3202a,0 0 0 5.5px rgba(179,32,42,0.38),0 0 14px ${color},0 2px 10px rgba(0,0,0,0.9);cursor:pointer;display:flex;align-items:center;justify-content:center;">${imgHtml}</div>`
    }

    return `<div style="box-sizing:border-box;width:18px;height:18px;background:${color};border:2.5px solid rgba(255,255,255,0.80);border-radius:5px;box-shadow:0 0 0 1px rgba(0,0,0,0.5),0 0 9px ${color}b0,0 2px 6px rgba(0,0,0,0.75);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform 0.1s;" onmouseenter="this.style.transform='scale(1.22)'" onmouseleave="this.style.transform='scale(1)'">${imgHtml}</div>`
}
