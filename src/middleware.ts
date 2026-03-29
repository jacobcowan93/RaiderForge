import type { NextRequest } from 'next/server'
import { middlewareHideLiveRail } from '@/lib/site/liveRail'

export function middleware(request: NextRequest) {
    return middlewareHideLiveRail(request)
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
