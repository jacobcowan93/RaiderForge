import { getNextUtcMondayMidnightMs } from '@/lib/trials/weeklyReset'

export type TrialsCountdownVariant = 'metaforge-active-end' | 'metaforge-next-start' | 'utc-monday-fallback'

export type TrialsCountdownResolution = {
    targetEpochMs: number
    variant: TrialsCountdownVariant
    /** ISO timestamp for the chosen target (for captions). */
    targetIso: string | null
}

type WeeklyLike = {
    source: 'metaforge' | 'fallback'
    activeWindowEnd: string | null
    nextWindowStart: string | null
}

/**
 * Countdown target for /trials hero.
 * Prefers MetaForge `GET .../weekly-trials` window fields (`activeWindowEnd`, `nextWindowStart`);
 * falls back to next UTC Monday 00:00 when API is unavailable or timestamps are unusable.
 */
export function resolveTrialsCountdownTarget(now: Date, weekly: WeeklyLike): TrialsCountdownResolution {
    const nowMs = now.getTime()

    if (weekly.source === 'metaforge') {
        if (weekly.activeWindowEnd) {
            const endMs = Date.parse(weekly.activeWindowEnd)
            if (!Number.isNaN(endMs) && endMs > nowMs) {
                return {
                    targetEpochMs: endMs,
                    variant: 'metaforge-active-end',
                    targetIso: weekly.activeWindowEnd,
                }
            }
        }
        if (weekly.nextWindowStart) {
            const startMs = Date.parse(weekly.nextWindowStart)
            if (!Number.isNaN(startMs) && startMs > nowMs) {
                return {
                    targetEpochMs: startMs,
                    variant: 'metaforge-next-start',
                    targetIso: weekly.nextWindowStart,
                }
            }
        }
    }

    return {
        targetEpochMs: getNextUtcMondayMidnightMs(now),
        variant: 'utc-monday-fallback',
        targetIso: null,
    }
}
