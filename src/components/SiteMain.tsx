import type { ReactNode } from 'react'

/** Matches fixed NavBar height (~py-3 + row ~52–56px + borders ≈ 4.75rem). */
export const SITE_MAIN_TOP_PAD_CLASS = 'pt-[4.75rem]'
/** Negative margin for full-bleed hero under fixed nav (same magnitude as `SITE_MAIN_TOP_PAD_CLASS`). */
export const SITE_MAIN_HERO_PULL_CLASS = '-mt-[4.75rem]'

/**
 * Primary content column below the nav. Live Conditions side rail was removed; maps command center
 * (`MapsTcnoCommandCenter`) is the single surface for zone modifiers and schedule timers.
 */
export function SiteMain({ children }: { children: ReactNode }) {
    return (
        <main
            id="main-content"
            tabIndex={-1}
            className={`rf-readable-copy relative flex-1 min-w-0 ${SITE_MAIN_TOP_PAD_CLASS} outline-none`}
        >
            {children}
        </main>
    )
}
