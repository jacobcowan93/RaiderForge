import { headers } from 'next/headers'
import LivePanel from '@/components/LivePanel'
import { RF_HIDE_LIVE_RAIL_HEADER } from '@/lib/site/liveRail'

/**
 * Main column: live conditions rail is omitted on Maps + Marketplace (see `src/middleware.ts` + `liveRail.ts`).
 * Uses a request header so behavior is correct under `NEXT_PUBLIC_BASE_PATH` (subpath deploys) and matches SSR.
 */
export async function SiteMain({ children }: { children: React.ReactNode }) {
    const h = await headers()
    const hideRail = h.get(RF_HIDE_LIVE_RAIL_HEADER) === '1'

    return (
        <main
            className={
                hideRail
                    ? 'relative flex-1 min-w-0 pt-16'
                    : 'relative flex-1 min-w-0 pt-16 pb-[3.25rem] xl:pb-0 xl:pr-[300px]'
            }
        >
            {!hideRail ? <LivePanel /> : null}
            {children}
        </main>
    )
}
