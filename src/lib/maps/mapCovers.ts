/**
 * Zone cover paths — re-exported from `mapZoneThumbnails` for backward compatibility.
 * @see mapZoneThumbnails.ts for the canonical registry and encoding rules.
 */

export {
    MAP_THUMBNAIL_BY_RF_MAP_ID as MAP_COVERS,
    mapCoverPath,
    encodeLocalPublicPath,
    UNKNOWN_ZONE_THUMBNAIL_FALLBACK,
    getZoneThumbnailUrlOrFallback,
} from '@/lib/maps/mapZoneThumbnails'

export type { MapZoneRfId as MapCoverRfId } from '@/lib/maps/mapZoneThumbnails'
