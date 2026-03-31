import { Suspense } from 'react'
import { MAPS } from '@/data/maps'
import { fetchCurrentEvents } from '@/lib/data/metaforge-events'
import { MapsTcnoCommandCenter } from '@/components/maps/MapsTcnoCommandCenter'
import { MapsHubSkeleton } from '@/components/maps/MapsHubSkeleton'
import { PageMaturityBadge } from '@/components/PageMaturityBadge'
import { getGameDataProvider } from '@/lib/game-data/provider'
import { indexGameMapsByRfId } from '@/lib/maps/rfGameMapBridge'
import { resolveMapsHubZoneParam } from '@/lib/maps/maps-hub-zone'
import { buildTcnoZoneVMs } from '@/lib/maps/build-maps-hub-zones'
import type { MfEvent } from '@/lib/events/conditions'

export const metadata = {
    title: 'Maps (Live) — ARC Raiders Command Center | Raider Forge',
    description:
        'Five ARC Raiders zones with RaiderForge interactive maps, curated POIs, and live MetaForge conditions.',
}

type PageProps = {
    searchParams: Promise<{ zone?: string }>
}

export default function MapsPage(props: PageProps) {
    return (
        <Suspense
            fallback={
                <div className="py-14 px-6 max-w-7xl mx-auto">
                    <MapsHubSkeleton />
                </div>
            }
        >
            <MapsPageContent {...props} />
        </Suspense>
    )
}

async function MapsPageContent({ searchParams }: PageProps) {
    const sp = await searchParams
    const resolved = resolveMapsHubZoneParam(sp.zone)
    const initialZoneId =
        resolved && MAPS.some((m) => m.id === resolved) ? resolved : null

    const [eventsPayload, gameMaps] = await Promise.all([
        fetchCurrentEvents().catch(() => ({
            events: [] as MfEvent[],
            fetchedAt: new Date().toISOString(),
            upstreamOk: false,
        })),
        getGameDataProvider()
            .getMaps()
            .catch((err) => {
                console.warn('[maps] game-data getMaps failed', err)
                return []
            }),
    ])

    const gameByRfId = indexGameMapsByRfId(gameMaps)
    const now = new Date()
    const tcnoZones = buildTcnoZoneVMs(
        now,
        eventsPayload.events,
        gameByRfId,
        eventsPayload.upstreamOk,
    )

    return (
        <div className="py-14 px-6 max-w-7xl mx-auto">

            <div className="mb-10 pl-1">
                <div className="border-l-2 border-rf-red pl-5">
                    <span className="text-xs uppercase tracking-widest text-rf-red font-semibold drop-shadow-sm">
                        Operations
                    </span>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-white text-shadow-hero">
                            ARC Raiders{' '}
                            <span className="text-rf-red">Maps Command Center</span>
                        </h1>
                        <PageMaturityBadge level="live" />
                    </div>
                    <p className="mt-2.5 text-sm max-w-2xl text-white text-shadow-hero leading-relaxed">
                        All five zones live here on RaiderForge with interactive tactical maps, curated POIs, and live condition
                        tracking. Deep links:{' '}
                        <span className="text-white/50">/maps?zone=dam</span>,{' '}
                        <span className="text-white/50">/maps/hub/bluegate</span>, etc.
                    </p>
                </div>
            </div>

            <MapsTcnoCommandCenter
                zones={tcnoZones}
                useTcnoIframe={false}
                initialZoneId={initialZoneId}
                liveConditionsUpdatedAt={eventsPayload.fetchedAt}
                liveConditionsUpstreamOk={eventsPayload.upstreamOk}
                liveMetaforgeEventCount={eventsPayload.events.length}
            />

            <p className="mt-10 text-[11px] text-white/30 text-shadow-hero leading-relaxed max-w-3xl">
                Interactive map experience hosted on RaiderForge. Source materials were incorporated with permission. Item / tile
                reference data from{' '}
                <a href="https://ardb.app" target="_blank" rel="noopener noreferrer"
                   className="hover:text-white/50 transition-colors underline underline-offset-2">
                    ardb.app
                </a>
                . Live conditions powered by{' '}
                <a href="https://metaforge.app/arc-raiders" target="_blank" rel="noopener noreferrer"
                   className="hover:text-white/50 transition-colors underline underline-offset-2">
                    MetaForge
                </a>
                .
            </p>
        </div>
    )
}
