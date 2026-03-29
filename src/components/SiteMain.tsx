import type { ReactNode } from 'react'

/**
 * Primary content column below the nav. Live Conditions side rail was removed; maps command center
 * (`MapsTcnoCommandCenter`) is the single surface for zone modifiers and schedule timers.
 */
export function SiteMain({ children }: { children: ReactNode }) {
    return <main className="relative flex-1 min-w-0 pt-16">{children}</main>
}
