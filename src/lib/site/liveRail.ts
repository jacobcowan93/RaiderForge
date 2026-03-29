import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Request header: when present, root `SiteMain` omits `LivePanel` and rail padding. */
export const RF_HIDE_LIVE_RAIL_HEADER = 'x-rf-hide-live-rail'

function stripBasePath(pathname: string): string {
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '')
    if (!base) return pathname
    if (pathname === base || pathname === `${base}/`) return '/'
    if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || '/'
    return pathname
}

/** True for `/maps`, `/maps/...`, `/marketplace`, `/marketplace/...` (after optional basePath). */
export function shouldHideLiveConditionsRail(pathname: string): boolean {
    const p = stripBasePath(pathname)
    return p === '/maps' || p.startsWith('/maps/') || p === '/marketplace' || p.startsWith('/marketplace/')
}

export function middlewareHideLiveRail(request: NextRequest): NextResponse {
    const pathname = request.nextUrl.pathname
    if (!shouldHideLiveConditionsRail(pathname)) {
        return NextResponse.next()
    }
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(RF_HIDE_LIVE_RAIL_HEADER, '1')
    return NextResponse.next({
        request: { headers: requestHeaders },
    })
}
