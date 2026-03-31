import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MAPS } from '@/data/maps'
import { fetchCurrentEvents } from '@/lib/data/metaforge-events'
import { getLiveMapConditions } from '@/lib/live-data/mapConditions'
import type { MfEvent } from '@/lib/events/conditions'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { MapsHubLegend } from '@/components/maps/MapsHubLegend'
import { getGameDataProvider } from '@/lib/game-data/provider'
import { indexGameMapsByRfId } from '@/lib/maps/rfGameMapBridge'
import {
    resolveMapsHubZoneParam,
    canonicalHubSlugForMapId,
    hubUrlForMapId,
} from '@/lib/maps/maps-hub-zone'
import { MapCoverImage } from '@/components/maps/MapCoverImage'
import { buildTcnoZoneVMs } from '@/lib/maps/build-maps-hub-zones'
import { getEventDescription, EVENT_ICONS } from '@/lib/events/eventsConfig'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
    const { slug } = await params
    const mapId = resolveMapsHubZoneParam(slug)
    const map = mapId ? MAPS.find((m) => m.id === mapId) : undefined
    return {
        title: map ? `${map.displayName} (Live) — Maps | Raider Forge` : 'Zone — Maps | Raider Forge',
    }
}

export default async function MapsHubZonePage({ params }: Props) {
    const { slug } = await params
    const mapId = resolveMapsHubZoneParam(slug)
    if (!mapId) notFound()
    const map = MAPS.find((m) => m.id === mapId)
    if (!map) notFound()

    const [eventsPayload, gameMaps] = await Promise.all([
        fetchCurrentEvents().catch(() => ({
            events: [] as MfEvent[],
            fetchedAt: new Date().toISOString(),
            upstreamOk: false,
        })),
        getGameDataProvider()
            .getMaps()
            .catch(() => {
                return []
            }),
    ])

    const gameByRfId = indexGameMapsByRfId(gameMaps)
    const now = new Date()
    const zones = buildTcnoZoneVMs(now, eventsPayload.events, gameByRfId, eventsPayload.upstreamOk)
    const zone = zones.find((z) => z.id === mapId)
    if (!zone) notFound()

    const conditions = getLiveMapConditions(map.id, now, eventsPayload.events, eventsPayload.upstreamOk)
    const hubQuery = hubUrlForMapId(map.id)

    return (
        <div className="py-14 px-6 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 mb-8">
                <Link
                    href="/maps"
                    className="inline-flex items-center gap-2 text-xs font-medium text-white/45 hover:text-white/85
                               bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 transition-all"
                >
                    ← Command center
                </Link>
                <Link
                    href={hubQuery}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-red-400/90 hover:text-red-300
                               border border-red-500/25 rounded-full px-3 py-1.5 transition-all"
                >
                    Same zone · URL bar focus
                </Link>
            </div>

            <div className="border-l-2 border-rf-red pl-5 mb-8">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs uppercase tracking-widest text-rf-red font-semibold">Zone briefing</span>
                    <PageMaturityBadge level="live" />
                </div>
                <h1 className="mt-2 text-3xl font-black text-white tracking-tight">{map.displayName}</h1>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{map.subtitle}</p>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-red-500/15 bg-black/60 mb-8 min-h-[220px] sm:min-h-[280px]">
                <MapCoverImage
                    src={zone.thumb}
                    alt={`${map.displayName} — zone preview`}
                    fill
                    sizes="(max-width: 640px) 100vw, min(896px, 90vw)"
                    className="object-cover opacity-45"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-end min-h-[220px] sm:min-h-[280px]">
                    {zone.conditionBadges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {zone.conditionBadges.map((b) => {
                                const icon = EVENT_ICONS[b.name]
                                return (
                                    <span
                                        key={b.name}
                                        title={getEventDescription(b.name)}
                                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1 border cursor-help"
                                        style={{
                                            backgroundColor: b.bg,
                                            borderColor: b.border,
                                            color: b.text,
                                        }}
                                    >
                                        {icon && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={icon} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />
                                        )}
                                        {b.name}
                                    </span>
                                )
                            })}
                        </div>
                    )}
                    <p className="text-sm text-white/70 leading-relaxed max-w-2xl mb-5">{map.description}</p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
                        <Link
                            href={`/maps/${map.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-6 py-3 border border-red-400/25"
                        >
                            Open RaiderForge interactive map
                        </Link>
                        <Link
                            href="/maps"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                        >
                            Back to command center
                        </Link>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-black/35 p-4 mb-8">
                <h2 className="text-[10px] uppercase tracking-widest text-white/40 font-semibold mb-2">Rotation snapshot</h2>
                <p className="text-xs text-white/55 leading-relaxed">
                    {conditions.activeConditions.length > 0
                        ? `Active now: ${conditions.activeConditions.join(', ')}. Timers refresh from MetaForge (or fallback rotation) — see the Active Maps rail site-wide.`
                        : 'No major/minor modifiers in this snapshot — check the Active Maps panel for live timers.'}
                </p>
            </div>

            <MapsHubLegend defaultOpen variant="featured" className="mb-10" />

            <p className="text-[11px] text-white/30 leading-relaxed">
                RaiderForge hosts the interactive map flow directly. Source materials were incorporated with permission. Tile data:{' '}
                <a href="https://ardb.app" target="_blank" rel="noopener noreferrer" className="hover:text-white/50">
                    ardb.app
                </a>
                .
            </p>
        </div>
    )
}
