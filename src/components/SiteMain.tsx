'use client'

import { usePathname } from 'next/navigation'
import LivePanel from '@/components/LivePanel'

function hideLiveConditionsRail(pathname: string | null): boolean {
    if (!pathname) return false
    if (pathname === '/maps' || pathname.startsWith('/maps/')) return true
    if (pathname === '/marketplace' || pathname.startsWith('/marketplace/')) return true
    return false
}

/**
 * Main column: live conditions rail is omitted on Maps + Marketplace (command center / browse carry their own live UI).
 * Padding matches: mobile bottom dock and desktop right rail only when the rail is mounted.
 */
export function SiteMain({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const hideRail = hideLiveConditionsRail(pathname)

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
