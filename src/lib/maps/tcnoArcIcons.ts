import type { MapPoi, PoiCategory } from './poi-types'

const BASE = '/vendor/tcno-icons'

function tcno(path: string) {
    return `${BASE}${path}`
}

export const TCNO_ARC_ICON_SRC = {
    key: tcno('/icons/key.svg'),
    quest: tcno('/icons/task.svg'),
    area: tcno('/icons/arc/areas.webp'),
    extractLift: tcno('/icons/arc/elevator.webp'),
    extractHatch: tcno('/icons/arc/hatch.webp'),
    extractAirshaft: tcno('/icons/arc/airshaft.webp'),
    extractMetro: tcno('/icons/arc/stairs.webp'),
    fieldCrate: tcno('/icons/arc/field-crate.webp'),
    raiderCache: tcno('/icons/arc/raider-cache.webp'),
    weaponCase: tcno('/icons/arc/weapon-case.webp'),
    lockers: tcno('/icons/arc/lockers.webp'),
    backpack: tcno('/icons/arc/backpack.webp'),
    arcGeneric: tcno('/icons/arc/arc-courier.webp'),
    arcSentinel: tcno('/icons/arc/sniper-turret.webp'),
    natureAgave: tcno('/icons/arc/agave.webp'),
    natureMoss: tcno('/icons/arc/moss.webp'),
    natureMushroom: tcno('/icons/arc/mushroom.webp'),
    natureOlive: tcno('/icons/arc/olive.webp'),
    natureFertilizer: tcno('/icons/arc/fertilizer.webp'),
    natureGreatMullein: tcno('/icons/arc/great-mullein.webp'),
    naturePricklyPear: tcno('/icons/arc/prickly-pear.webp'),
    drawbridge: tcno('/icons/arc/drawbridge.webp'),
    batteryTerminal: tcno('/icons/arc/battery_terminal.webp'),
    scissorLift: tcno('/icons/arc/scissor-lift.webp'),
    zipline: tcno('/icons/arc/zipline.webp'),
    camera: tcno('/icons/arc/camera.webp'),
    metalDetector: tcno('/icons/arc/metal-detector.webp'),
    fieldDepot: tcno('/icons/arc/field-depot.webp'),
    raiderCamp: tcno('/icons/arc/raider-camp.webp'),
} as const

export function getCategoryIconSrc(category: PoiCategory): string {
    switch (category) {
        case 'extract':
            return TCNO_ARC_ICON_SRC.extractLift
        case 'key':
            return TCNO_ARC_ICON_SRC.key
        case 'quest':
            return TCNO_ARC_ICON_SRC.quest
        case 'area':
            return TCNO_ARC_ICON_SRC.area
        case 'container':
        case 'loot':
            return TCNO_ARC_ICON_SRC.fieldCrate
        case 'arc':
            return TCNO_ARC_ICON_SRC.arcGeneric
        case 'nature':
            return TCNO_ARC_ICON_SRC.natureAgave
        case 'interaction':
            return TCNO_ARC_ICON_SRC.drawbridge
        case 'noise':
            return TCNO_ARC_ICON_SRC.camera
    }
}

/**
 * Conservative accuracy-first resolver:
 * use only exact or high-confidence name signals from the current RaiderForge POI set.
 * Anything ambiguous falls back to the category icon instead of guessing.
 */
export function resolvePoiIconSrc(poi: Pick<MapPoi, 'category' | 'name' | 'iconKey'>): string {
    const key = poi.iconKey?.trim()
    if (key && key in TCNO_ARC_ICON_SRC) {
        return TCNO_ARC_ICON_SRC[key as keyof typeof TCNO_ARC_ICON_SRC]
    }

    const name = poi.name.toLowerCase()

    if (poi.category === 'extract') {
        if (name.includes('hatch')) return TCNO_ARC_ICON_SRC.extractHatch
        if (name.includes('metro') || name.includes('subway')) return TCNO_ARC_ICON_SRC.extractMetro
        if (name.includes('airshaft') || name.includes('shaft')) return TCNO_ARC_ICON_SRC.extractAirshaft
        return TCNO_ARC_ICON_SRC.extractLift
    }

    if (poi.category === 'arc') {
        if (name.includes('sentinel')) return TCNO_ARC_ICON_SRC.arcSentinel
        return TCNO_ARC_ICON_SRC.arcGeneric
    }

    if (poi.category === 'nature') {
        if (name.includes('agave')) return TCNO_ARC_ICON_SRC.natureAgave
        if (name.includes('moss')) return TCNO_ARC_ICON_SRC.natureMoss
        if (name.includes('mushroom')) return TCNO_ARC_ICON_SRC.natureMushroom
        if (name.includes('olive')) return TCNO_ARC_ICON_SRC.natureOlive
        if (name.includes('fertilizer')) return TCNO_ARC_ICON_SRC.natureFertilizer
        if (name.includes('mullein')) return TCNO_ARC_ICON_SRC.natureGreatMullein
        if (name.includes('prickly pear')) return TCNO_ARC_ICON_SRC.naturePricklyPear
        return TCNO_ARC_ICON_SRC.natureAgave
    }

    if (poi.category === 'interaction') {
        if (name.includes('drawbridge')) return TCNO_ARC_ICON_SRC.drawbridge
        if (name.includes('battery terminal')) return TCNO_ARC_ICON_SRC.batteryTerminal
        if (name.includes('scissor lift')) return TCNO_ARC_ICON_SRC.scissorLift
        if (name.includes('zipline')) return TCNO_ARC_ICON_SRC.zipline
        return TCNO_ARC_ICON_SRC.drawbridge
    }

    if (poi.category === 'noise') {
        if (name.includes('metal detector')) return TCNO_ARC_ICON_SRC.metalDetector
        return TCNO_ARC_ICON_SRC.camera
    }

    if (poi.category === 'loot' || poi.category === 'container') {
        if (name.includes('weapon case')) return TCNO_ARC_ICON_SRC.weaponCase
        if (name.includes('locker')) return TCNO_ARC_ICON_SRC.lockers
        if (name.includes('backpack')) return TCNO_ARC_ICON_SRC.backpack
        if (name.includes('cache')) return TCNO_ARC_ICON_SRC.raiderCache
        if (name.includes('field depot')) return TCNO_ARC_ICON_SRC.fieldDepot
        if (name.includes('raider camp')) return TCNO_ARC_ICON_SRC.raiderCamp
        return TCNO_ARC_ICON_SRC.fieldCrate
    }

    return getCategoryIconSrc(poi.category)
}
