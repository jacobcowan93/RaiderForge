import type { MapPoi } from '@/lib/maps/poi-types'

/**
 * Dam Battlegrounds — starter POIs (percent coordinates).
 * Tune positions with NEXT_PUBLIC_RF_POI_PLACEMENT=1 click-to-sample workflow.
 */
export const damBattlegroundsPois: MapPoi[] = [
    {
        id: 'dam-battlegrounds-extract-north',
        mapId: 'dam-battlegrounds',
        name: 'North extract',
        category: 'extract',
        x: 74,
        y: 18,
        description: 'Extraction point toward the upper road / dam approach.',
        tags: ['extract', 'north'],
    },
    {
        id: 'dam-battlegrounds-extract-south',
        mapId: 'dam-battlegrounds',
        name: 'South extract',
        category: 'extract',
        x: 48,
        y: 82,
        description: 'Southern extraction — verify in-game against latest map revision.',
        tags: ['extract', 'south'],
    },
]
